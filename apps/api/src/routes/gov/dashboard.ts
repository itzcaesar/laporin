// ── apps/api/src/routes/gov/dashboard.ts ──
// Government dashboard statistics with Redis caching

import { Hono } from 'hono'
import { db } from '../../db.js'
import { redis } from '../../lib/redis.js'
import { authMiddleware, type AuthVariables } from '../../middleware/auth.js'
import { requireRole } from '../../middleware/requireRole.js'

const govDashboard = new Hono<{ Variables: AuthVariables }>()

// All routes require officer role
govDashboard.use('*', authMiddleware, requireRole('officer'))

/**
 * GET /gov/dashboard/stats
 * Overview statistics for dashboard
 */
govDashboard.get('/stats', async (c) => {
  const user = c.get('user')
  const agencyId = user.agencyId

  try {
    // Try to get from cache
    const cacheKey = `laporin:dashboard:stats:${agencyId || 'all'}`
    const cached = await redis.get(cacheKey)
    
    if (cached) {
      return c.json({ data: JSON.parse(cached), cached: true })
    }

    // Build where clause
    const where: any = {}
    if (user.role !== 'super_admin' && agencyId) {
      where.agencyId = agencyId
    }

    // Get counts by status
    const statusCounts = await db.report.groupBy({
      by: ['status'],
      where,
      _count: true,
    })

    // Get total reports
    const totalReports = statusCounts.reduce((sum, item) => sum + item._count, 0)

    // Get resolved count (completed + verified_complete + closed)
    const resolvedCount = statusCounts
      .filter((item) => ['completed', 'verified_complete', 'closed'].includes(item.status))
      .reduce((sum, item) => sum + item._count, 0)

    // Get average resolution time (in days)
    const resolvedReports = await db.report.findMany({
      where: {
        ...where,
        status: { in: ['completed', 'verified_complete', 'closed'] },
        completedAt: { not: null },
      },
      select: {
        createdAt: true,
        completedAt: true,
      },
    })

    const avgResolutionDays =
      resolvedReports.length > 0
        ? resolvedReports.reduce((sum, report) => {
            const days = Math.floor(
              (report.completedAt!.getTime() - report.createdAt.getTime()) / (1000 * 60 * 60 * 24)
            )
            return sum + days
          }, 0) / resolvedReports.length
        : 0

    // Get reports by priority
    const priorityCounts = await db.report.groupBy({
      by: ['priority'],
      where,
      _count: true,
    })

    // Get SLA breached count (estimated end date passed but not completed)
    const now = new Date()
    const slaBreachedCount = await db.report.count({
      where: {
        ...where,
        status: { in: ['new', 'verified', 'in_progress'] },
        estimatedEnd: { lt: now },
      },
    })

    // Get new reports today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const newToday = await db.report.count({
      where: {
        ...where,
        createdAt: { gte: today },
      },
    })

    // Get average satisfaction rating
    const avgRating = await db.satisfactionRating.aggregate({
      where: {
        report: where.agencyId ? { agencyId: where.agencyId } : undefined,
      },
      _avg: {
        rating: true,
      },
    })

    const stats = {
      totalReports,
      resolvedCount,
      resolutionRate: totalReports > 0 ? (resolvedCount / totalReports) * 100 : 0,
      avgResolutionDays: Math.round(avgResolutionDays * 10) / 10,
      statusBreakdown: statusCounts.reduce(
        (acc, item) => {
          acc[item.status] = item._count
          return acc
        },
        {} as Record<string, number>
      ),
      priorityBreakdown: priorityCounts.reduce(
        (acc, item) => {
          acc[item.priority] = item._count
          return acc
        },
        {} as Record<string, number>
      ),
      slaBreachedCount,
      newToday,
      avgSatisfactionRating: avgRating._avg.rating || 0,
    }

    // Cache for 60 seconds
    await redis.setex(cacheKey, 60, JSON.stringify(stats))

    return c.json({ data: stats, cached: false })
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return c.json({ error: 'Failed to fetch dashboard stats' }, 500)
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

    return c.json({ data: recentReports })
  } catch (error) {
    console.error('Recent reports error:', error)
    return c.json({ error: 'Failed to fetch recent reports' }, 500)
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

    return c.json({
      data: {
        urgentReports,
        slaBreached,
      },
    })
  } catch (error) {
    console.error('Urgent reports error:', error)
    return c.json({ error: 'Failed to fetch urgent reports' }, 500)
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

    return c.json({ data: myReports })
  } catch (error) {
    console.error('My assignments error:', error)
    return c.json({ error: 'Failed to fetch assignments' }, 500)
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
      return c.json({
        data: {
          predictedWeeklyTotal: 0,
          bySubdistrict: [],
          recommendation: null,
          message: 'Prediksi akan tersedia setelah CRON job pertama berjalan',
        },
      })
    }

    const forecast = JSON.parse(cached)
    return c.json({ data: forecast })
  } catch (error) {
    console.error('Workload forecast error:', error)
    return c.json({ error: 'Failed to fetch workload forecast' }, 500)
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
      return c.json({ data: JSON.parse(cached), cached: true })
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
        ST_Y(location) as lat,
        ST_X(location) as lng,
        priority_score / 100.0 as intensity
      FROM reports
      WHERE ${db.$queryRawUnsafe(whereConditions)}
        AND location IS NOT NULL
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

    return c.json({ data: formattedData, cached: false })
  } catch (error) {
    console.error('Dashboard heatmap error:', error)
    return c.json({ error: 'Failed to fetch heatmap data' }, 500)
  }
})

export default govDashboard
