// ── apps/api/src/routes/gov/analytics.ts ──
// Government analytics with PostGIS queries

import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { db } from '../../db.js'
import { redis } from '../../lib/redis.js'
import { authMiddleware, type AuthVariables } from '../../middleware/auth.js'
import { requireRole } from '../../middleware/requireRole.js'
import { analyticsQuerySchema as legacyAnalyticsQuerySchema } from '../../validators/gov.validator.js'
import { analyticsQuerySchema } from '../../validators/analytics.validator.js'

const govAnalytics = new Hono<{ Variables: AuthVariables }>()

// All routes require officer role
govAnalytics.use('*', authMiddleware, requireRole('officer'))

/**
 * GET /gov/analytics/overview
 * Aggregate KPI summary statistics
 */
govAnalytics.get('/overview', zValidator('query', analyticsQuerySchema), async (c) => {
  const user = c.get('user')
  const { period } = c.req.valid('query')

  try {
    // Calculate date range
    const now = new Date()
    const daysMap = { '30': 30, '90': 90, '365': 365 }
    const days = daysMap[period as '30' | '90' | '365'] || 30
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)

    // Build where clause based on role
    const where: any = {
      createdAt: { gte: startDate },
    }

    // Role-based filtering
    if (user.role === 'officer') {
      // Officers only see their assigned reports
      where.assignedOfficerId = user.sub
    } else if (user.role === 'admin' && user.agencyId) {
      // Admins see their agency's reports
      where.agencyId = user.agencyId
    }
    // Super admins see all reports (no additional filter)

    // Generate consistent cache key
    const cacheKey = `analytics:overview:${user.agencyId || 'all'}:${period}`
    const cached = await redis.get(cacheKey)
    
    if (cached) {
      return c.json({
        success: true,
        data: JSON.parse(cached),
      })
    }

    // Calculate metrics
    const [totalReports, completedReports, resolutionData, slaData] = await Promise.all([
      // Total reports count
      db.report.count({ where }),

      // Completed reports count
      db.report.count({
        where: {
          ...where,
          status: { in: ['completed', 'verified_complete', 'closed'] },
        },
      }),

      // Average resolution days - build query dynamically
      (() => {
        let query = `
          SELECT AVG(EXTRACT(EPOCH FROM (completed_at - created_at)) / 86400) as avg_days
          FROM reports
          WHERE completed_at IS NOT NULL
            AND created_at >= $1
        `
        const params: any[] = [startDate]
        
        if (user.role === 'officer') {
          query += ` AND assigned_officer_id = $2::uuid`
          params.push(user.sub)
        } else if (user.role === 'admin' && user.agencyId) {
          query += ` AND agency_id = $2::uuid`
          params.push(user.agencyId)
        }
        
        return db.$queryRawUnsafe<Array<{ avg_days: number | null }>>(query, ...params)
      })(),

      // SLA compliance calculation - build query dynamically
      (() => {
        let query = `
          SELECT 
            COUNT(CASE 
              WHEN EXTRACT(EPOCH FROM (completed_at - created_at)) / 86400 <= 
                CASE priority
                  WHEN 'urgent' THEN 2
                  WHEN 'high' THEN 7
                  WHEN 'medium' THEN 14
                  WHEN 'low' THEN 30
                END
              THEN 1 
            END) as on_time,
            COUNT(CASE 
              WHEN EXTRACT(EPOCH FROM (completed_at - created_at)) / 86400 > 
                CASE priority
                  WHEN 'urgent' THEN 2
                  WHEN 'high' THEN 7
                  WHEN 'medium' THEN 14
                  WHEN 'low' THEN 30
                END
              THEN 1 
            END) as breached
          FROM reports
          WHERE completed_at IS NOT NULL
            AND created_at >= $1
        `
        const params: any[] = [startDate]
        
        if (user.role === 'officer') {
          query += ` AND assigned_officer_id = $2::uuid`
          params.push(user.sub)
        } else if (user.role === 'admin' && user.agencyId) {
          query += ` AND agency_id = $2::uuid`
          params.push(user.agencyId)
        }
        
        return db.$queryRawUnsafe<Array<{ on_time: bigint; breached: bigint }>>(query, ...params)
      })(),
    ])

    // Calculate average resolution days
    const avgResolutionDays = resolutionData[0]?.avg_days 
      ? Math.round(resolutionData[0].avg_days * 10) / 10 
      : 0

    // Calculate SLA compliance percentage
    const onTime = Number(slaData[0]?.on_time || 0)
    const breached = Number(slaData[0]?.breached || 0)
    const totalCompleted = onTime + breached
    const slaCompliancePercent = totalCompleted > 0 
      ? Math.round((onTime / totalCompleted) * 1000) / 10 
      : 0

    const result = {
      totalReports,
      completedReports,
      avgResolutionDays,
      slaCompliancePercent,
      cachedAt: new Date().toISOString(),
    }

    // Cache for 5 minutes (300 seconds)
    await redis.setex(cacheKey, 300, JSON.stringify(result))

    return c.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error('Analytics overview error:', error)
    return c.json(
      { 
        success: false, 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'Failed to fetch analytics overview' 
        } 
      }, 
      500
    )
  }
})

/**
 * GET /gov/analytics/trends
 * Daily report counts for trend visualization
 */
govAnalytics.get('/trends', zValidator('query', analyticsQuerySchema), async (c) => {
  const user = c.get('user')
  const { period } = c.req.valid('query')

  try {
    // Calculate date range
    const now = new Date()
    const daysMap = { '30': 30, '90': 90, '365': 365 }
    const days = daysMap[period as '30' | '90' | '365'] || 30
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)

    // Generate consistent cache key
    const cacheKey = `analytics:trends:${user.agencyId || 'all'}:${period}`
    const cached = await redis.get(cacheKey)
    
    if (cached) {
      return c.json({
        success: true,
        data: JSON.parse(cached),
      })
    }

    // Build where clause based on role
    const where: any = {
      createdAt: { gte: startDate },
    }

    // Role-based filtering
    if (user.role === 'officer') {
      // Officers only see their assigned reports
      where.assignedOfficerId = user.sub
    } else if (user.role === 'admin' && user.agencyId) {
      // Admins see their agency's reports
      where.agencyId = user.agencyId
    }
    // Super admins see all reports (no additional filter)

    // Get daily report counts using raw SQL for better performance
    let query = `
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM reports
      WHERE created_at >= $1
    `
    const params: any[] = [startDate]
    
    if (user.role === 'officer') {
      query += ` AND assigned_officer_id = $2::uuid`
      params.push(user.sub)
    } else if (user.role === 'admin' && user.agencyId) {
      query += ` AND agency_id = $2::uuid`
      params.push(user.agencyId)
    }
    
    query += `
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `

    const dailyCounts = await db.$queryRawUnsafe<Array<{ date: Date; count: bigint }>>(query, ...params)

    // Generate complete date series with missing dates filled as 0
    const dateCountMap = new Map<string, number>()
    dailyCounts.forEach(item => {
      const dateStr = item.date.toISOString().split('T')[0] // YYYY-MM-DD format
      dateCountMap.set(dateStr, Number(item.count))
    })

    // Fill missing dates with count: 0
    const result: Array<{ date: string; count: number }> = []
    const currentDate = new Date(startDate)
    const endDate = new Date(now)
    
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0]
      result.push({
        date: dateStr,
        count: dateCountMap.get(dateStr) || 0
      })
      currentDate.setDate(currentDate.getDate() + 1)
    }

    // Cache for 5 minutes (300 seconds)
    await redis.setex(cacheKey, 300, JSON.stringify(result))

    return c.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error('Analytics trends error:', error)
    return c.json(
      { 
        success: false, 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'Failed to fetch analytics trends' 
        } 
      }, 
      500
    )
  }
})

/**
 * GET /gov/analytics/categories
 * Top 5 categories by report count with emoji
 */
govAnalytics.get('/categories', zValidator('query', analyticsQuerySchema), async (c) => {
  const user = c.get('user')
  const { period } = c.req.valid('query')

  try {
    // Calculate date range
    const now = new Date()
    const daysMap = { '30': 30, '90': 90, '365': 365 }
    const days = daysMap[period as '30' | '90' | '365'] || 30
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)

    // Generate consistent cache key
    const cacheKey = `analytics:categories:${user.agencyId || 'all'}:${period}`
    const cached = await redis.get(cacheKey)
    
    if (cached) {
      return c.json({
        success: true,
        data: JSON.parse(cached),
      })
    }

    // Build where clause based on role
    const where: any = {
      createdAt: { gte: startDate },
    }

    // Role-based filtering
    if (user.role === 'officer') {
      // Officers only see their assigned reports
      where.assignedOfficerId = user.sub
    } else if (user.role === 'admin' && user.agencyId) {
      // Admins see their agency's reports
      where.agencyId = user.agencyId
    }
    // Super admins see all reports (no additional filter)

    // Get category distribution using Prisma groupBy with join
    const categoryStats = await db.report.groupBy({
      by: ['categoryId'],
      where,
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 5, // Top 5 categories only
    })

    // Get category details (name and emoji) for the top categories
    const categoryIds = categoryStats.map(stat => stat.categoryId)
    const categories = await db.category.findMany({
      where: {
        id: { in: categoryIds },
        isActive: true, // Only active categories
      },
      select: {
        id: true,
        name: true,
        emoji: true,
      },
    })

    // Create a map for quick lookup
    const categoryMap = new Map(categories.map(cat => [cat.id, cat]))

    // Build result with category details and counts
    const result = categoryStats
      .map(stat => {
        const category = categoryMap.get(stat.categoryId)
        if (!category) return null // Skip if category not found or inactive
        
        return {
          categoryId: stat.categoryId,
          categoryName: category.name,
          emoji: category.emoji,
          count: stat._count.id,
        }
      })
      .filter(Boolean) // Remove null entries
      .filter(item => item!.count > 0) // Exclude categories with zero reports

    // Cache for 5 minutes (300 seconds)
    await redis.setex(cacheKey, 300, JSON.stringify(result))

    return c.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error('Analytics categories error:', error)
    return c.json(
      { 
        success: false, 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'Failed to fetch categories distribution' 
        } 
      }, 
      500
    )
  }
})

/**
 * GET /gov/analytics/heatmap
 * Geographic heatmap data using PostGIS
 */
govAnalytics.get('/heatmap', async (c) => {
  const user = c.get('user')
  const { regionCode, period = '30d' } = c.req.query()

  try {
    // Calculate date range
    const now = new Date()
    const daysMap: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90, '365d': 365 }
    const days = daysMap[period] || 30
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)

    // Build where conditions
    let whereConditions = `created_at >= '${startDate.toISOString()}'`
    if (user.role !== 'super_admin' && user.agencyId) {
      whereConditions += ` AND agency_id = '${user.agencyId}'`
    }
    if (regionCode) {
      whereConditions += ` AND region_code = '${regionCode}'`
    }

    // PostGIS query for spatial clustering
    const heatmapData = await db.$queryRaw<
      Array<{ lat: number; lng: number; count: bigint; priority_avg: number }>
    >`
      SELECT 
        ST_Y(ST_Centroid(ST_Collect(location))) as lat,
        ST_X(ST_Centroid(ST_Collect(location))) as lng,
        COUNT(*) as count,
        AVG(priority_score) as priority_avg
      FROM reports
      WHERE ${db.$queryRawUnsafe(whereConditions)}
        AND location IS NOT NULL
      GROUP BY ST_SnapToGrid(location, 0.01)
      HAVING COUNT(*) > 0
      ORDER BY count DESC
      LIMIT 500
    `

    return c.json({
      data: heatmapData.map((item: any) => ({
        lat: item.lat,
        lng: item.lng,
        count: Number(item.count),
        priorityAvg: item.priority_avg,
      })),
    })
  } catch (error) {
    console.error('Analytics heatmap error:', error)
    return c.json({ error: 'Failed to fetch heatmap data' }, 500)
  }
})

/**
 * GET /gov/analytics/performance
 * Officer and agency performance metrics
 */
govAnalytics.get('/performance', zValidator('query', legacyAnalyticsQuerySchema), async (c) => {
  const user = c.get('user')
  const { period, agencyId } = c.req.valid('query')

  try {
    // Calculate date range
    const now = new Date()
    const daysMap = { '7d': 7, '30d': 30, '90d': 90, '365d': 365 }
    const days = daysMap[period]
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)

    // Build where clause
    let whereConditions = `created_at >= '${startDate.toISOString()}'`
    if (user.role !== 'super_admin' && user.agencyId) {
      whereConditions += ` AND agency_id = '${user.agencyId}'`
    }
    if (agencyId) {
      whereConditions += ` AND agency_id = '${agencyId}'`
    }

    // Officer performance
    const officerPerformance = await db.$queryRaw<
      Array<{
        officer_id: string
        officer_name: string
        total_assigned: bigint
        completed: bigint
        avg_resolution_days: number
      }>
    >`
      SELECT 
        u.id as officer_id,
        u.name as officer_name,
        COUNT(*) as total_assigned,
        COUNT(CASE WHEN r.status IN ('completed', 'verified_complete', 'closed') THEN 1 END) as completed,
        AVG(
          CASE 
            WHEN r.completed_at IS NOT NULL 
            THEN EXTRACT(EPOCH FROM (r.completed_at - r.created_at)) / 86400
            ELSE NULL
          END
        ) as avg_resolution_days
      FROM reports r
      JOIN users u ON r.assigned_officer_id = u.id
      WHERE ${db.$queryRawUnsafe(whereConditions)}
        AND r.assigned_officer_id IS NOT NULL
      GROUP BY u.id, u.name
      ORDER BY completed DESC
      LIMIT 20
    `

    // Agency performance (if super_admin)
    let agencyPerformance: any[] = []
    if (user.role === 'super_admin') {
      agencyPerformance = await db.$queryRaw<
        Array<{
          agency_id: string
          agency_name: string
          total_reports: bigint
          completed: bigint
          avg_resolution_days: number
          satisfaction_avg: number
        }>
      >`
        SELECT 
          a.id as agency_id,
          a.name as agency_name,
          COUNT(*) as total_reports,
          COUNT(CASE WHEN r.status IN ('completed', 'verified_complete', 'closed') THEN 1 END) as completed,
          AVG(
            CASE 
              WHEN r.completed_at IS NOT NULL 
              THEN EXTRACT(EPOCH FROM (r.completed_at - r.created_at)) / 86400
              ELSE NULL
            END
          ) as avg_resolution_days,
          AVG(rat.score) as satisfaction_avg
        FROM reports r
        JOIN agencies a ON r.agency_id = a.id
        LEFT JOIN ratings rat ON r.id = rat.report_id
        WHERE r.created_at >= ${startDate}
        GROUP BY a.id, a.name
        ORDER BY completed DESC
      `
    }

    return c.json({
      data: {
        officers: officerPerformance.map((item: any) => ({
          officerId: item.officer_id,
          officerName: item.officer_name,
          totalAssigned: Number(item.total_assigned),
          completed: Number(item.completed),
          completionRate:
            Number(item.total_assigned) > 0
              ? (Number(item.completed) / Number(item.total_assigned)) * 100
              : 0,
          avgResolutionDays: item.avg_resolution_days
            ? Math.round(item.avg_resolution_days * 10) / 10
            : null,
        })),
        agencies: agencyPerformance.map((item: any) => ({
          agencyId: item.agency_id,
          agencyName: item.agency_name,
          totalReports: Number(item.total_reports),
          completed: Number(item.completed),
          completionRate:
            Number(item.total_reports) > 0
              ? (Number(item.completed) / Number(item.total_reports)) * 100
              : 0,
          avgResolutionDays: item.avg_resolution_days
            ? Math.round(item.avg_resolution_days * 10) / 10
            : null,
          satisfactionAvg: item.satisfaction_avg
            ? Math.round(item.satisfaction_avg * 10) / 10
            : null,
        })),
      },
    })
  } catch (error) {
    console.error('Analytics performance error:', error)
    return c.json({ error: 'Failed to fetch performance metrics' }, 500)
  }
})

/**
 * GET /gov/analytics/sla
 * SLA compliance metrics for donut chart visualization
 */
govAnalytics.get('/sla', zValidator('query', analyticsQuerySchema), async (c) => {
  const user = c.get('user')
  const { period } = c.req.valid('query')

  try {
    // Calculate date range
    const now = new Date()
    const daysMap = { '30': 30, '90': 90, '365': 365 }
    const days = daysMap[period as '30' | '90' | '365'] || 30
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)

    // Generate consistent cache key
    const cacheKey = `analytics:sla:${user.agencyId || 'all'}:${period}`
    const cached = await redis.get(cacheKey)
    
    if (cached) {
      return c.json({
        success: true,
        data: JSON.parse(cached),
      })
    }

    // SLA compliance calculation - build query dynamically
    let query = `
      SELECT 
        COUNT(CASE 
          WHEN EXTRACT(EPOCH FROM (completed_at - created_at)) / 86400 <= 
            CASE priority
              WHEN 'urgent' THEN 2
              WHEN 'high' THEN 7
              WHEN 'medium' THEN 14
              WHEN 'low' THEN 30
            END
          THEN 1 
        END) as on_time,
        COUNT(CASE 
          WHEN EXTRACT(EPOCH FROM (completed_at - created_at)) / 86400 > 
            CASE priority
              WHEN 'urgent' THEN 2
              WHEN 'high' THEN 7
              WHEN 'medium' THEN 14
              WHEN 'low' THEN 30
            END
          THEN 1 
        END) as breached
      FROM reports
      WHERE completed_at IS NOT NULL
        AND status IN ('completed', 'verified_complete', 'closed')
        AND created_at >= $1
    `
    const params: any[] = [startDate]
    
    // Role-based filtering
    if (user.role === 'officer') {
      query += ` AND assigned_officer_id = $2::uuid`
      params.push(user.sub)
    } else if (user.role === 'admin' && user.agencyId) {
      query += ` AND agency_id = $2::uuid`
      params.push(user.agencyId)
    }

    const slaData = await db.$queryRawUnsafe<Array<{ on_time: bigint; breached: bigint }>>(query, ...params)

    // Extract counts and convert from bigint to number
    const onTime = Number(slaData[0]?.on_time || 0)
    const breached = Number(slaData[0]?.breached || 0)

    const result = {
      onTime,
      breached,
    }

    // Cache for 5 minutes (300 seconds)
    await redis.setex(cacheKey, 300, JSON.stringify(result))

    return c.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error('Analytics SLA error:', error)
    return c.json(
      { 
        success: false, 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'Failed to fetch SLA compliance metrics' 
        } 
      }, 
      500
    )
  }
})

/**
 * GET /gov/analytics/satisfaction
 * Average citizen satisfaction score
 */
govAnalytics.get('/satisfaction', zValidator('query', analyticsQuerySchema), async (c) => {
  const user = c.get('user')
  const { period } = c.req.valid('query')

  try {
    // Calculate date range
    const now = new Date()
    const daysMap = { '30': 30, '90': 90, '365': 365 }
    const days = daysMap[period as '30' | '90' | '365'] || 30
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)

    // Generate consistent cache key
    const cacheKey = `analytics:satisfaction:${user.agencyId || 'all'}:${period}`
    const cached = await redis.get(cacheKey)
    
    if (cached) {
      return c.json({
        success: true,
        data: JSON.parse(cached),
      })
    }

    // Build where clause for reports based on role
    const reportWhere: any = {
      createdAt: { gte: startDate },
    }

    // Role-based filtering
    if (user.role === 'officer') {
      // Officers only see their assigned reports
      reportWhere.assignedOfficerId = user.sub
    } else if (user.role === 'admin' && user.agencyId) {
      // Admins see their agency's reports
      reportWhere.agencyId = user.agencyId
    }
    // Super admins see all reports (no additional filter)

    // Join satisfaction_ratings with reports and calculate average
    const [satisfactionData, completedReportsCount] = await Promise.all([
      db.satisfactionRating.findMany({
        where: {
          report: reportWhere
        },
        select: {
          rating: true
        }
      }),
      db.report.count({
        where: {
          ...reportWhere,
          status: { in: ['completed', 'verified_complete', 'closed'] }
        }
      })
    ])

    // Calculate average rating and total count
    const totalRatings = satisfactionData.length
    let averageRating: number | null = null
    let responseRate: number = 0

    if (totalRatings > 0) {
      const sum = satisfactionData.reduce((acc, rating) => acc + rating.rating, 0)
      averageRating = Math.round((sum / totalRatings) * 10) / 10 // Round to 1 decimal place
      
      if (completedReportsCount > 0) {
        responseRate = Math.round((totalRatings / completedReportsCount) * 100)
      }
    }

    const result = {
      averageRating,
      totalRatings,
      completedReportsCount,
      responseRate,
    }

    // Cache for 5 minutes (300 seconds)
    await redis.setex(cacheKey, 300, JSON.stringify(result))

    return c.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error('Analytics satisfaction error:', error)
    return c.json(
      { 
        success: false, 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'Failed to fetch satisfaction metrics' 
        } 
      }, 
      500
    )
  }
})

/**
 * GET /gov/analytics/insights
 * AI-generated insights from Redis cache
 * Requirements: 7.1, 7.2, 7.3, 7.4
 * 
 * This endpoint retrieves AI-generated insights from Redis cache.
 * The actual AI generation is handled by a background CRON job that populates the cache.
 */
govAnalytics.get('/insights', async (c) => {
  const user = c.get('user')

  try {
    // Check Redis for cached insights with role-based key
    const cacheKey = `analytics:insights:${user.agencyId || 'all'}`
    const cached = await redis.get(cacheKey)

    if (cached) {
      // Parse cached insights
      const parsedData = JSON.parse(cached)
      
      return c.json({
        success: true,
        data: {
          insights: parsedData.insights || [],
          generatedAt: parsedData.generatedAt || null,
        },
      })
    }

    // If not found, return placeholder message
    return c.json({
      success: true,
      data: {
        insights: ['Insight AI sedang dihasilkan. Silakan cek kembali dalam beberapa saat.'],
        generatedAt: null,
      },
    })
  } catch (error) {
    console.error('Analytics insights error:', error)
    return c.json(
      { 
        success: false, 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'Gagal memuat insight AI' 
        } 
      }, 
      500
    )
  }
})

/**
 * GET /gov/analytics/anomalies
 * Detect unusual spikes in report volumes
 * Compares last 24 hours vs 7-day baseline
 */
govAnalytics.get('/anomalies', async (c) => {
  const user = c.get('user')

  try {
    // Generate consistent cache key
    const cacheKey = `analytics:anomalies:${user.agencyId || 'all'}`
    const cached = await redis.get(cacheKey)
    
    if (cached) {
      return c.json({
        success: true,
        data: JSON.parse(cached),
      })
    }

    // Calculate time ranges
    const now = new Date()
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const baseline7DaysStart = new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000) // 8 days ago to 1 day ago

    // Build where clause based on role
    let recentWhereConditions = `created_at >= '${last24Hours.toISOString()}'`
    let baselineWhereConditions = `created_at >= '${baseline7DaysStart.toISOString()}' AND created_at < '${last24Hours.toISOString()}'`
    
    // Role-based filtering
    if (user.role === 'officer') {
      recentWhereConditions += ` AND assigned_officer_id = '${user.sub}'::uuid`
      baselineWhereConditions += ` AND assigned_officer_id = '${user.sub}'::uuid`
    } else if (user.role === 'admin' && user.agencyId) {
      recentWhereConditions += ` AND agency_id = '${user.agencyId}'::uuid`
      baselineWhereConditions += ` AND agency_id = '${user.agencyId}'::uuid`
    }
    // Super admins see all reports (no additional filter)

    // Get recent counts (last 24 hours) grouped by region and category
    const recentCounts = await db.$queryRawUnsafe<
      Array<{ region_code: string; category_id: number; count: bigint }>
    >(`
      SELECT 
        region_code,
        category_id,
        COUNT(*) as count
      FROM reports
      WHERE ${recentWhereConditions}
      GROUP BY region_code, category_id
    `)

    // Get baseline counts (previous 7 days) grouped by region and category
    const baselineCounts = await db.$queryRawUnsafe<
      Array<{ region_code: string; category_id: number; count: bigint }>
    >(`
      SELECT 
        region_code,
        category_id,
        COUNT(*) as count
      FROM reports
      WHERE ${baselineWhereConditions}
      GROUP BY region_code, category_id
    `)

    // Create baseline map for quick lookup
    const baselineMap = new Map<string, number>()
    baselineCounts.forEach(item => {
      const key = `${item.region_code}:${item.category_id}`
      // Calculate daily average for 7-day baseline
      baselineMap.set(key, Number(item.count) / 7)
    })

    // Detect anomalies (spikes > 150% of baseline)
    const anomalies: Array<{
      id: string
      regionName: string
      categoryName: string
      spikePercent: number
      hoursAgo: number
      reportCount: number
    }> = []

    // Get unique region codes and category IDs for lookup
    const regionCodes = new Set<string>()
    const categoryIds = new Set<number>()
    
    recentCounts.forEach(item => {
      regionCodes.add(item.region_code)
      categoryIds.add(item.category_id)
    })

    // Fetch region names (from agencies table)
    const agencies = await db.agency.findMany({
      where: {
        regionCode: { in: Array.from(regionCodes) }
      },
      select: {
        regionCode: true,
        regionName: true
      }
    })
    const regionMap = new Map(agencies.map(a => [a.regionCode, a.regionName]))

    // Fetch category names
    const categories = await db.category.findMany({
      where: {
        id: { in: Array.from(categoryIds) }
      },
      select: {
        id: true,
        name: true
      }
    })
    const categoryMap = new Map(categories.map(c => [c.id, c.name]))

    // Calculate spikes
    recentCounts.forEach(item => {
      const key = `${item.region_code}:${item.category_id}`
      const recentCount = Number(item.count)
      const baselineAvg = baselineMap.get(key) || 0

      // Calculate spike percentage
      let spikePercent = 0
      if (baselineAvg > 0) {
        spikePercent = ((recentCount - baselineAvg) / baselineAvg) * 100
      } else if (recentCount > 0) {
        // New spike with no baseline
        spikePercent = 100
      }

      // Flag if spike > 150%
      if (spikePercent > 150) {
        const regionName = regionMap.get(item.region_code) || item.region_code
        const categoryName = categoryMap.get(item.category_id) || `Category ${item.category_id}`

        anomalies.push({
          id: `${item.region_code}-${item.category_id}-${Date.now()}`,
          regionName,
          categoryName,
          spikePercent: Math.round(spikePercent * 10) / 10, // Round to 1 decimal
          hoursAgo: 24, // Last 24 hours
          reportCount: recentCount
        })
      }
    })

    // Sort by spike percentage descending and limit to top 10
    const result = anomalies
      .sort((a, b) => b.spikePercent - a.spikePercent)
      .slice(0, 10)

    // Cache for 1 hour (3600 seconds)
    await redis.setex(cacheKey, 3600, JSON.stringify(result))

    return c.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error('Analytics anomalies error:', error)
    return c.json(
      { 
        success: false, 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'Failed to detect anomalies' 
        } 
      }, 
      500
    )
  }
})

/**
 * GET /gov/analytics/category-trends
 * Category growth/decline analysis comparing current vs previous period
 */
govAnalytics.get('/category-trends', zValidator('query', analyticsQuerySchema), async (c) => {
  const user = c.get('user')
  const { period } = c.req.valid('query')

  try {
    // Calculate date ranges
    const now = new Date()
    const daysMap = { '30': 30, '90': 90, '365': 365 }
    const days = daysMap[period as '30' | '90' | '365'] || 30
    const currentStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
    const previousStart = new Date(now.getTime() - days * 2 * 24 * 60 * 60 * 1000)

    // Generate consistent cache key
    const cacheKey = `analytics:category-trends:${user.agencyId || 'all'}:${period}`
    const cached = await redis.get(cacheKey)
    
    if (cached) {
      return c.json({
        success: true,
        data: JSON.parse(cached),
      })
    }

    // Build where clause based on role
    const where: any = {}

    // Role-based filtering
    if (user.role === 'officer') {
      // Officers only see their assigned reports
      where.assignedOfficerId = user.sub
    } else if (user.role === 'admin' && user.agencyId) {
      // Admins see their agency's reports
      where.agencyId = user.agencyId
    }
    // Super admins see all reports (no additional filter)

    // Get current period counts
    const currentCounts = await db.report.groupBy({
      by: ['categoryId'],
      where: { ...where, createdAt: { gte: currentStart } },
      _count: {
        id: true,
      },
    })

    // Get previous period counts (same duration, shifted back)
    const previousCounts = await db.report.groupBy({
      by: ['categoryId'],
      where: { ...where, createdAt: { gte: previousStart, lt: currentStart } },
      _count: {
        id: true,
      },
    })

    // Get all unique category IDs from both periods
    const categoryIds = [
      ...new Set([
        ...currentCounts.map((c) => c.categoryId),
        ...previousCounts.map((c) => c.categoryId),
      ]),
    ]

    // Fetch category details (name and emoji)
    const categories = await db.category.findMany({
      where: {
        id: { in: categoryIds },
        isActive: true, // Only active categories
      },
      select: {
        id: true,
        name: true,
        emoji: true,
      },
    })

    // Create a map for quick lookup
    const categoryMap = new Map(categories.map((cat) => [cat.id, cat]))

    // Calculate percentage change for each category
    const trends = categoryIds
      .map((categoryId) => {
        const category = categoryMap.get(categoryId)
        if (!category) return null // Skip if category not found or inactive

        const currentCount = currentCounts.find((c) => c.categoryId === categoryId)?._count.id || 0
        const previousCount = previousCounts.find((c) => c.categoryId === categoryId)?._count.id || 0

        // Calculate percentage change
        let changePercent = 0
        if (previousCount > 0) {
          // Normal case: calculate percentage change
          changePercent = ((currentCount - previousCount) / previousCount) * 100
        } else if (currentCount > 0) {
          // New category (no previous data): show 100% increase
          changePercent = 100
        } else {
          // Both zero: no change
          changePercent = 0
        }

        return {
          categoryId: categoryId,
          categoryName: category.name,
          emoji: category.emoji,
          currentCount: currentCount,
          changePercent: Math.round(changePercent * 10) / 10, // Round to 1 decimal
        }
      })
      .filter(Boolean) // Remove null entries
      .sort((a, b) => Math.abs(b!.changePercent) - Math.abs(a!.changePercent)) // Sort by absolute change DESC

    // Cache for 5 minutes (300 seconds)
    await redis.setex(cacheKey, 300, JSON.stringify(trends))

    return c.json({
      success: true,
      data: trends,
    })
  } catch (error) {
    console.error('Analytics category trends error:', error)
    return c.json(
      { 
        success: false, 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'Failed to fetch category trends' 
        } 
      }, 
      500
    )
  }
})

/**
 * GET /gov/analytics/officer-performance
 * Officer productivity and quality metrics
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5
 */
govAnalytics.get('/officer-performance', zValidator('query', analyticsQuerySchema), async (c) => {
  const user = c.get('user')
  const { period } = c.req.valid('query')

  try {
    // Calculate date range
    const now = new Date()
    const daysMap = { '30': 30, '90': 90, '365': 365 }
    const days = daysMap[period as '30' | '90' | '365'] || 30
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)

    // Generate consistent cache key
    const cacheKey = `analytics:officers:${user.agencyId || 'all'}:${period}`
    const cached = await redis.get(cacheKey)
    
    if (cached) {
      return c.json({
        success: true,
        data: JSON.parse(cached),
      })
    }

    // Build query based on role
    let query = `
      SELECT 
        u.id as officer_id,
        u.name as officer_name,
        COUNT(*) as assigned_count,
        COUNT(CASE 
          WHEN r.status IN ('completed', 'verified_complete', 'closed') 
          THEN 1 
        END) as completed_count,
        AVG(
          CASE 
            WHEN r.completed_at IS NOT NULL 
            THEN EXTRACT(EPOCH FROM (r.completed_at - r.created_at)) / 86400
            ELSE NULL
          END
        ) as avg_resolution_days,
        AVG(sr.rating) as avg_rating
      FROM reports r
      JOIN users u ON r.assigned_officer_id = u.id
      LEFT JOIN satisfaction_ratings sr ON r.id = sr.report_id
      WHERE r.created_at >= $1
        AND r.assigned_officer_id IS NOT NULL
    `
    const params: any[] = [startDate]
    
    // Role-based filtering
    if (user.role === 'officer') {
      // Officers only see their own metrics
      query += ` AND r.assigned_officer_id = $2::uuid`
      params.push(user.sub)
    } else if (user.role === 'admin' && user.agencyId) {
      // Admins see all officers in their agency
      query += ` AND r.agency_id = $2::uuid`
      params.push(user.agencyId)
    }
    // Super admins see all officers (no additional filter)
    
    query += `
      GROUP BY u.id, u.name
      ORDER BY completed_count DESC
      LIMIT 20
    `

    const officerPerformance = await db.$queryRawUnsafe<
      Array<{
        officer_id: string
        officer_name: string
        assigned_count: bigint
        completed_count: bigint
        avg_resolution_days: number | null
        avg_rating: number | null
      }>
    >(query, ...params)

    // Format the result
    const result = officerPerformance.map((item) => ({
      officerId: item.officer_id,
      officerName: item.officer_name,
      assignedCount: Number(item.assigned_count),
      completedCount: Number(item.completed_count),
      avgResolutionDays: item.avg_resolution_days 
        ? Math.round(item.avg_resolution_days * 10) / 10 
        : 0,
      avgRating: item.avg_rating 
        ? Math.round(item.avg_rating * 10) / 10 
        : null,
    }))

    // Cache for 5 minutes (300 seconds)
    await redis.setex(cacheKey, 300, JSON.stringify(result))

    return c.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error('Analytics officer performance error:', error)
    return c.json(
      { 
        success: false, 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'Failed to fetch officer performance metrics' 
        } 
      }, 
      500
    )
  }
})

/**
 * GET /gov/analytics/ai-insights
 * Daily AI insight text from CRON job
 */
govAnalytics.get('/ai-insights', async (c) => {
  const user = c.get('user')

  try {
    const cacheKey = `laporin:insights:gov:${user.agencyId || 'all'}`
    const cached = await redis.get(cacheKey)

    if (!cached) {
      return c.json({
        data: {
          insight: 'Insight harian akan tersedia setelah CRON job pertama berjalan',
          generatedAt: null,
        },
      })
    }

    return c.json({
      data: {
        insight: cached,
        generatedAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('Analytics AI insights error:', error)
    return c.json({ error: 'Failed to fetch AI insights' }, 500)
  }
})

/**
 * GET /gov/analytics/predicted-heatmap
 * AI-predicted risk zones for next 30 days
 */
govAnalytics.get('/predicted-heatmap', async (c) => {
  const user = c.get('user')

  try {
    // Try cache first (6 hour TTL)
    const cacheKey = `laporin:map:predicted:${user.agencyId || 'all'}`
    const cached = await redis.get(cacheKey)

    if (cached) {
      return c.json({ data: JSON.parse(cached), cached: true })
    }

    // Get historical hotspots (last 90 days)
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)

    const where: any = { createdAt: { gte: ninetyDaysAgo } }
    if (user.role !== 'super_admin' && user.agencyId) {
      where.agencyId = user.agencyId
    }

    // Simple prediction: areas with high historical density are likely to have issues again
    const predictedHotspots = await db.$queryRaw<
      Array<{ lat: number; lng: number; intensity: number }>
    >`
      SELECT 
        ST_Y(ST_Centroid(ST_Collect(location))) as lat,
        ST_X(ST_Centroid(ST_Collect(location))) as lng,
        COUNT(*) * 1.2 as intensity
      FROM reports
      WHERE created_at >= ${ninetyDaysAgo}
        ${user.agencyId ? db.$queryRawUnsafe(`AND agency_id = '${user.agencyId}'`) : db.$queryRawUnsafe('')}
        AND location IS NOT NULL
      GROUP BY ST_SnapToGrid(location, 0.01)
      HAVING COUNT(*) > 2
      ORDER BY intensity DESC
      LIMIT 200
    `

    const formattedData = predictedHotspots.map((item) => ({
      lat: item.lat,
      lng: item.lng,
      intensity: Math.round(item.intensity * 10) / 10,
    }))

    // Cache for 6 hours
    await redis.setex(cacheKey, 6 * 60 * 60, JSON.stringify(formattedData))

    return c.json({ data: formattedData, cached: false })
  } catch (error) {
    console.error('Analytics predicted heatmap error:', error)
    return c.json({ error: 'Failed to fetch predicted heatmap' }, 500)
  }
})

export default govAnalytics
