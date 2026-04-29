import { Hono } from 'hono'
import { Prisma } from '@prisma/client'
import { db } from '../../db.js'
import { ok, err } from '../../lib/response.js'
import { redis } from '../../lib/redis.js'
import { authMiddleware, type AuthVariables } from '../../middleware/auth.js'
import { requireRole } from '../../middleware/requireRole.js'
import { env } from '../../env.js'

// ── AI Insight Generator (fire-and-forget, cached 30 min) ──────────────────────

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'
const INSIGHT_MODELS = [
  'openai/gpt-oss-120b:free',
  'google/gemma-4-26b-a4b-it:free',
  'meta-llama/llama-3.3-70b-instruct:free',
  'qwen/qwen3-next-80b-a3b-instruct:free',
  'meta-llama/llama-3.1-8b-instruct',
] as const

type InsightContext = {
  totalReports: number
  newToday: number
  slaBreached: number
  slaCompliance: number
  completedCount: number
  urgentCount: number
  topCategory: string
  topCategoryCount: number
  recentWeekTotal: number
  prevWeekTotal: number
}

async function generateAiInsight(cacheKey: string, ctx: InsightContext): Promise<void> {
  const apiKey = env.OPENROUTER_API_KEY || env.ANTHROPIC_API_KEY
  if (!apiKey) return

  const prompt = `Kamu adalah analis data pemerintah Indonesia. Berdasarkan data berikut, tulis 1-2 kalimat insight singkat dalam Bahasa Indonesia formal. Fokus pada temuan paling penting atau anomali.

DATA:
- Total laporan: ${ctx.totalReports}
- Laporan baru hari ini: ${ctx.newToday}
- Laporan darurat aktif: ${ctx.urgentCount}
- SLA terlampaui: ${ctx.slaBreached}
- Kepatuhan SLA: ${ctx.slaCompliance}%
- Laporan selesai: ${ctx.completedCount}
- Kategori terbanyak: ${ctx.topCategory} (${ctx.topCategoryCount} laporan)
- Volume minggu ini: ${ctx.recentWeekTotal} (minggu lalu: ${ctx.prevWeekTotal})

Tulis hanya insight-nya, tanpa pengantar atau penutup.`

  for (const model of INSIGHT_MODELS) {
    try {
      const res = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://laporin.site',
          'X-Title': 'Laporin Dashboard Insight',
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 200,
          temperature: 0.3,
        }),
      })

      if (!res.ok) {
        if (res.status === 429 || res.status === 404) continue
        throw new Error(`OpenRouter ${res.status}`)
      }

      const data = (await res.json()) as any
      const text: string = data.choices?.[0]?.message?.content?.trim() ?? ''
      
      if (text && text.length > 10) {
        await redis.setex(cacheKey, 30 * 60, text) // cache 30 min
        console.log(`[AI Insight] Generated via ${model}`)
        return
      }
    } catch (e) {
      console.warn(`[AI Insight] Model ${model} failed:`, e)
      continue
    }
  }
}
const govDashboard = new Hono<{ Variables: AuthVariables }>()

// All routes require officer role
govDashboard.use('*', authMiddleware, requireRole('officer'))

/**
 * GET /gov/dashboard/stats
 * Overview statistics for dashboard (OPTIMIZED with aggressive caching)
 */
govDashboard.get('/stats', async (c) => {
  const user = c.get('user')
  const agencyId = user.agencyId
  const isSuperAdmin = user.role === 'super_admin'

  try {
    // Build cache key
    const cacheKey = `dashboard:stats:${agencyId || 'all'}`
    
    // Try cache first (5-minute TTL for dashboard stats)
    const cached = await redis.get(cacheKey).catch(() => null)
    if (cached) {
      const cachedData = JSON.parse(cached)
      c.header('X-Cache', 'HIT')
      return ok(c, cachedData)
    }

    // Build where clause
    const where: any = {}
    if (!isSuperAdmin && agencyId) {
      where.agencyId = agencyId
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Conditional SQL fragments for raw queries
    const agencyFilter = (!isSuperAdmin && agencyId) 
      ? Prisma.sql`AND agency_id = ${agencyId}::uuid` 
      : Prisma.empty

    const [
      totalReports,
      newToday,
      slaBreached,
      satisfactionData,
      urgentReports,
      recentReports,
      trendDataRaw,
      categoryDistribution,
      completedCount,
    ] = await Promise.all([
      db.report.count({ where }),
      db.report.count({ where: { ...where, createdAt: { gte: today } } }),

      // SLA breached: estimated_end is in the past, status not done
      db.report.count({
        where: {
          ...where,
          estimatedEnd: { lt: new Date() },
          status: { notIn: ['completed', 'verified_complete', 'closed', 'rejected'] },
        },
      }),

      db.satisfactionRating.aggregate({
        where: (!isSuperAdmin && agencyId) ? { report: { agencyId } } : {},
        _avg: { rating: true },
      }),

      // Urgent (P1) reports
      db.report.findMany({
        where: {
          ...where,
          priority: 'urgent',
          status: { notIn: ['completed', 'verified_complete', 'closed'] },
        },
        take: 5,
        select: { id: true, title: true, locationAddress: true, trackingCode: true },
      }),

      // Recent 5
      db.report.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          category: { select: { id: true, name: true, emoji: true } },
          assignedOfficer: { select: { name: true } },
        }
      }),

      // 30-day trend
      db.$queryRaw<Array<{ date: string; count: number }>>`
        SELECT 
          DATE_TRUNC('day', created_at)::date as date,
          COUNT(*)::int as count
        FROM reports
        WHERE created_at >= (CURRENT_DATE - INTERVAL '30 days')
        ${agencyFilter}
        GROUP BY 1
        ORDER BY 1 ASC
      `,

      // Category distribution
      db.report.groupBy({
        by: ['categoryId'],
        where,
        _count: { id: true },
      }),

      // Completed count for compliance calculation
      db.report.count({
        where: { ...where, status: { in: ['completed', 'verified_complete'] } }
      })
    ])

    // Fetch category names for distribution
    const categories = await db.category.findMany({
      where: { id: { in: categoryDistribution.map(c => c.categoryId) } }
    })

    const formattedCategoryDistribution = categoryDistribution.map(item => {
      const cat = categories.find(c => c.id === item.categoryId)
      return {
        name: cat?.name || 'Lainnya',
        emoji: cat?.emoji || '📍',
        count: item._count.id,
      }
    }).sort((a, b) => b.count - a.count).slice(0, 5)

    // Calculate SLA compliance (completed before or on estimated_end)
    const onTimeCountRaw = await db.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*)::bigint as count
      FROM reports
      WHERE status IN ('completed', 'verified_complete')
        AND updated_at <= estimated_end
        ${agencyFilter}
    `
    const onTimeCount = Number(onTimeCountRaw[0]?.count || 0)

    const slaCompliance = completedCount > 0 
      ? Math.round((onTimeCount / completedCount) * 100) 
      : 0

    // ── Compute workload forecast from trend data ──
    // Compare last 7 days vs previous 7 days to estimate next week's change
    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
    
    const recentWeekData = trendDataRaw.filter(d => new Date(d.date) >= sevenDaysAgo)
    const prevWeekData = trendDataRaw.filter(d => {
      const date = new Date(d.date)
      return date >= fourteenDaysAgo && date < sevenDaysAgo
    })
    
    const recentWeekTotal = recentWeekData.reduce((sum, d) => sum + Number(d.count), 0)
    const prevWeekTotal = prevWeekData.reduce((sum, d) => sum + Number(d.count), 0)
    const workloadForecast = prevWeekTotal > 0 
      ? Math.round(((recentWeekTotal - prevWeekTotal) / prevWeekTotal) * 100) 
      : null

    // ── Compute efficiency score (0-10) ──
    // Weighted: 40% SLA compliance, 30% completion rate, 30% satisfaction
    const completionRate = totalReports > 0 ? (completedCount / totalReports) : 0
    const satScore = satisfactionData._avg.rating ?? 0
    const efficiencyScore = Math.round((
      (slaCompliance / 100) * 4 +     // 40% weight, scaled to 4
      completionRate * 3 +              // 30% weight, scaled to 3
      (satScore / 5) * 3               // 30% weight, scaled to 3
    ) * 10) / 10 // round to 1 decimal

    // ── Compute trend percent (total reports vs previous 30 days) ──
    const thirtyDaysAgoDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const sixtyDaysAgoDate = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)
    const [prevPeriodCount] = await Promise.all([
      db.report.count({
        where: {
          ...where,
          createdAt: { gte: sixtyDaysAgoDate, lt: thirtyDaysAgoDate },
        },
      }),
    ])
    const currentPeriodCount = trendDataRaw.reduce((sum, d) => sum + Number(d.count), 0)
    const trendPercent = prevPeriodCount > 0
      ? Math.round(((currentPeriodCount - prevPeriodCount) / prevPeriodCount) * 100)
      : null

    // ── AI Insight (cached, non-blocking) ──
    const aiCacheKey = `laporin:dashboard:ai-insight:${user.agencyId || 'all'}`
    let aiInsight: string | null = null
    try {
      const cached = await redis.get(aiCacheKey)
      if (cached) {
        aiInsight = cached
      } else {
        // Fire-and-forget AI generation so it doesn't block the response
        generateAiInsight(aiCacheKey, {
          totalReports,
          newToday,
          slaBreached,
          slaCompliance,
          completedCount,
          urgentCount: urgentReports.length,
          topCategory: formattedCategoryDistribution[0]?.name || 'N/A',
          topCategoryCount: formattedCategoryDistribution[0]?.count || 0,
          recentWeekTotal,
          prevWeekTotal,
        }).catch(err => console.error('[AI Insight] Generation failed:', err))
      }
    } catch (e) {
      // Redis read failure — proceed without insight
      console.error('[AI Insight] Cache read failed:', e)
    }

    // Build result object
    const result = {
      totalReports,
      newToday,
      slaBreachedCount: slaBreached,
      satisfactionAvg: satisfactionData._avg.rating ? Math.round(satisfactionData._avg.rating * 10) / 10 : 0,
      slaCompliance,
      urgentReports,
      recentReports: recentReports.map((r) => ({
        id: r.id,
        trackingCode: r.trackingCode,
        status: r.status,
        categoryId: r.category.id,
        categoryName: r.category.name,
        categoryEmoji: r.category.emoji,
        locationAddress: r.locationAddress,
        picName: r.assignedOfficer?.name || null,
        createdAt: r.createdAt.toISOString(),
      })),
      trendData: trendDataRaw.map(d => ({
        date: new Date(d.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
        count: Number(d.count)
      })),
      categoryDistribution: formattedCategoryDistribution,
      aiInsight,
      workloadForecast,
      efficiencyScore,
      trendPercent,
    }

    // Cache the result for 5 minutes (300 seconds)
    await redis.setex(cacheKey, 300, JSON.stringify(result)).catch(() => {
      console.warn('Failed to cache dashboard stats')
    })

    c.header('X-Cache', 'MISS')
    return ok(c, result)
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return err(c, 'INTERNAL_ERROR', 'Gagal memuat statistik dashboard', 500)
  }
})

/**
 * GET /gov/dashboard/recent
 * Recent reports for quick view
 */
govDashboard.get('/recent', async (c) => {
  const user = c.get('user')
  const limit = 10

  try {
    const where: any = {}
    if (user.role !== 'super_admin' && user.agencyId) {
      where.agencyId = user.agencyId
    }

    const recentReports = await db.report.findMany({
      where,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        category: {
          select: {
            name: true,
            emoji: true,
          },
        },
        reporter: {
          select: {
            name: true,
          },
        },
      },
    })

    return ok(c, recentReports)
  } catch (error) {
    console.error('Recent reports error:', error)
    return err(c, 'INTERNAL_ERROR', 'Failed to fetch recent reports', 500)
  }
})

/**
 * GET /gov/dashboard/urgent
 * Urgent reports requiring immediate attention
 */
govDashboard.get('/urgent', async (c) => {
  const user = c.get('user')

  try {
    const where: any = {
      status: { in: ['new', 'verified', 'in_progress'] },
    }

    if (user.role !== 'super_admin' && user.agencyId) {
      where.agencyId = user.agencyId
    }

    // Get urgent priority reports
    const urgentReports = await db.report.findMany({
      where: {
        ...where,
        priority: 'urgent',
      },
      take: 10,
      orderBy: { priorityScore: 'desc' },
      include: {
        category: {
          select: {
            name: true,
            emoji: true,
          },
        },
        assignedOfficer: {
          select: {
            name: true,
          },
        },
      },
    })

    // Get SLA breached reports
    const now = new Date()
    const slaBreached = await db.report.findMany({
      where: {
        ...where,
        estimatedEnd: { lt: now },
      },
      take: 10,
      orderBy: { estimatedEnd: 'asc' },
      include: {
        category: {
          select: {
            name: true,
            emoji: true,
          },
        },
        assignedOfficer: {
          select: {
            name: true,
          },
        },
      },
    })

    return ok(c, {
      urgentReports,
      slaBreached,
    })
  } catch (error) {
    console.error('Urgent reports error:', error)
    return err(c, 'INTERNAL_ERROR', 'Failed to fetch urgent reports', 500)
  }
})

/**
 * GET /gov/dashboard/my-assignments
 * Reports assigned to current officer
 */
govDashboard.get('/my-assignments', async (c) => {
  const user = c.get('user')

  try {
    const myReports = await db.report.findMany({
      where: {
        assignedOfficerId: user.sub,
        status: { in: ['verified', 'in_progress'] },
      },
      orderBy: { priorityScore: 'desc' },
      include: {
        category: {
          select: {
            name: true,
            emoji: true,
          },
        },
      },
    })

    return ok(c, myReports)
  } catch (error) {
    console.error('My assignments error:', error)
    return err(c, 'INTERNAL_ERROR', 'Failed to fetch assignments', 500)
  }
})

/**
 * GET /gov/dashboard/workload-forecast
 * Predicted workload for next week from CRON job
 */
govDashboard.get('/workload-forecast', async (c) => {
  const user = c.get('user')

  try {
    const cacheKey = `laporin:forecast:gov:${user.agencyId || 'all'}`
    const cached = await redis.get(cacheKey)

    if (!cached) {
      return ok(c, {
        predictedWeeklyTotal: 0,
        bySubdistrict: [],
        recommendation: null,
        message: 'Prediksi akan tersedia setelah CRON job pertama berjalan',
      })
    }

    const forecast = JSON.parse(cached)
    return ok(c, forecast)
  } catch (error) {
    console.error('Workload forecast error:', error)
    return err(c, 'INTERNAL_ERROR', 'Failed to fetch workload forecast', 500)
  }
})

/**
 * GET /gov/dashboard/heatmap
 * PostGIS density query for heatmap visualization
 */
govDashboard.get('/heatmap', async (c) => {
  const user = c.get('user')

  try {
    // Try cache first (5 minute TTL)
    const cacheKey = `laporin:map:heatmap:${user.agencyId || 'all'}`
    const cached = await redis.get(cacheKey)

    if (cached) {
      return c.json({ success: true, data: JSON.parse(cached), cached: true })
    }

    // Build where conditions
    let whereConditions = "status IN ('new', 'verified', 'in_progress')"
    if (user.role !== 'super_admin' && user.agencyId) {
      whereConditions += ` AND agency_id = '${user.agencyId}'`
    }

    // PostGIS query for heatmap data (leaflet.heat format: [[lat, lng, intensity], ...])
    const heatmapData = await db.$queryRaw<
      Array<{ lat: number; lng: number; intensity: number }>
    >`
      SELECT 
        location_lat::float as lat,
        location_lng::float as lng,
        priority_score / 100.0 as intensity
      FROM reports
      WHERE ${Prisma.raw(whereConditions)}
        AND location_lat IS NOT NULL
        AND location_lng IS NOT NULL
      ORDER BY priority_score DESC
      LIMIT 1000
    `

    // Format for leaflet.heat: [[lat, lng, intensity], ...]
    const formattedData = heatmapData.map((item) => [
      item.lat,
      item.lng,
      Math.max(0.1, Math.min(1.0, item.intensity)), // Clamp between 0.1 and 1.0
    ])

    // Cache for 5 minutes
    await redis.setex(cacheKey, 5 * 60, JSON.stringify(formattedData))

    return c.json({ success: true, data: formattedData, cached: false })
  } catch (error) {
    console.error('Dashboard heatmap error:', error)
    return err(c, 'INTERNAL_ERROR', 'Failed to fetch heatmap data', 500)
  }
})

export default govDashboard
