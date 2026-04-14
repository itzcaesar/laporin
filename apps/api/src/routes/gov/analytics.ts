// ── apps/api/src/routes/gov/analytics.ts ──
// Government analytics with PostGIS queries

import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { db } from '../../db.js'
import { redis } from '../../lib/redis.js'
import { authMiddleware, type AuthVariables } from '../../middleware/auth.js'
import { requireRole } from '../../middleware/requireRole.js'
import { analyticsQuerySchema } from '../../validators/gov.validator.js'

const govAnalytics = new Hono<{ Variables: AuthVariables }>()

// All routes require officer role
govAnalytics.use('*', authMiddleware, requireRole('officer'))

/**
 * GET /gov/analytics/trends
 * Report trends over time
 */
govAnalytics.get('/trends', zValidator('query', analyticsQuerySchema), async (c) => {
  const user = c.get('user')
  const { period, regionCode, agencyId } = c.req.valid('query')

  try {
    // Calculate date range
    const now = new Date()
    const daysMap = { '7d': 7, '30d': 30, '90d': 90, '365d': 365 }
    const days = daysMap[period]
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)

    // Build where clause
    const where: any = {
      createdAt: { gte: startDate },
    }

    if (user.role !== 'super_admin' && user.agencyId) {
      where.agencyId = user.agencyId
    }

    if (regionCode) where.regionCode = regionCode
    if (agencyId) where.agencyId = agencyId

    // Get daily report counts
    const dailyCounts = (await db.$queryRaw`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM reports
      WHERE created_at >= ${startDate}
        ${regionCode ? db.$queryRawUnsafe(`AND region_code = '${regionCode}'`) : db.$queryRawUnsafe('')}
        ${agencyId ? db.$queryRawUnsafe(`AND agency_id = '${agencyId}'`) : db.$queryRawUnsafe('')}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `) as Array<{ date: Date; count: bigint }>

    // Get category breakdown
    const categoryBreakdown = await db.report.groupBy({
      by: ['categoryId'],
      where,
      _count: true,
      orderBy: {
        _count: {
          categoryId: 'desc',
        },
      },
      take: 10,
    })

    // Get categories details
    const categoryIds = categoryBreakdown.map((item: any) => item.categoryId)
    const categories = await db.category.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, name: true, emoji: true },
    })

    const categoryMap = new Map(categories.map((cat: any) => [cat.id, cat]))

    const topCategories = categoryBreakdown.map((item: any) => ({
      category: categoryMap.get(item.categoryId),
      count: item._count,
    }))

    // Get status progression
    const statusProgression = await db.report.groupBy({
      by: ['status'],
      where,
      _count: true,
    })

    // Get resolution time distribution
    const resolutionTimes = await db.$queryRaw<
      Array<{ bucket: string; count: bigint }>
    >`
      SELECT 
        CASE 
          WHEN EXTRACT(EPOCH FROM (completed_at - created_at)) / 86400 <= 1 THEN '0-1 days'
          WHEN EXTRACT(EPOCH FROM (completed_at - created_at)) / 86400 <= 3 THEN '1-3 days'
          WHEN EXTRACT(EPOCH FROM (completed_at - created_at)) / 86400 <= 7 THEN '3-7 days'
          WHEN EXTRACT(EPOCH FROM (completed_at - created_at)) / 86400 <= 14 THEN '7-14 days'
          WHEN EXTRACT(EPOCH FROM (completed_at - created_at)) / 86400 <= 30 THEN '14-30 days'
          ELSE '30+ days'
        END as bucket,
        COUNT(*) as count
      FROM reports
      WHERE completed_at IS NOT NULL
        AND created_at >= ${startDate}
        ${regionCode ? db.$queryRawUnsafe(`AND region_code = '${regionCode}'`) : db.$queryRawUnsafe('')}
        ${agencyId ? db.$queryRawUnsafe(`AND agency_id = '${agencyId}'`) : db.$queryRawUnsafe('')}
      GROUP BY bucket
      ORDER BY 
        CASE bucket
          WHEN '0-1 days' THEN 1
          WHEN '1-3 days' THEN 2
          WHEN '3-7 days' THEN 3
          WHEN '7-14 days' THEN 4
          WHEN '14-30 days' THEN 5
          ELSE 6
        END
    `

    return c.json({
      data: {
        period,
        dailyCounts: dailyCounts.map((item) => ({
          date: item.date,
          count: Number(item.count),
        })),
        topCategories,
        statusProgression: statusProgression.map((item: any) => ({
          status: item.status,
          count: item._count,
        })),
        resolutionTimes: resolutionTimes.map((item: any) => ({
          bucket: item.bucket,
          count: Number(item.count),
        })),
      },
    })
  } catch (error) {
    console.error('Analytics trends error:', error)
    return c.json({ error: 'Failed to fetch analytics trends' }, 500)
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
govAnalytics.get('/performance', zValidator('query', analyticsQuerySchema), async (c) => {
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
 * GET /gov/analytics/insights
 * AI-generated insights about the data
 */
govAnalytics.get('/insights', requireRole('admin'), async (c) => {
  const user = c.get('user')

  try {
    // Try cache first
    const cacheKey = `laporin:analytics:insights:${user.agencyId || 'all'}`
    const cached = await redis.get(cacheKey)

    if (cached) {
      return c.json({ data: JSON.parse(cached), cached: true })
    }

    // Get summary data for AI analysis
    const where: any = {}
    if (user.role !== 'super_admin' && user.agencyId) {
      where.agencyId = user.agencyId
    }

    const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    const summaryData = {
      totalReports: await db.report.count({ where }),
      recentReports: await db.report.count({
        where: { ...where, createdAt: { gte: last30Days } },
      }),
      avgResolutionDays: await db.$queryRaw`
        SELECT AVG(EXTRACT(EPOCH FROM (completed_at - created_at)) / 86400) as avg_days
        FROM reports
        WHERE completed_at IS NOT NULL
          ${user.agencyId ? db.$queryRawUnsafe(`AND agency_id = '${user.agencyId}'`) : db.$queryRawUnsafe('')}
      `,
      topCategories: await db.report.groupBy({
        by: ['categoryId'],
        where: { ...where, createdAt: { gte: last30Days } },
        _count: true,
        orderBy: { _count: { categoryId: 'desc' } },
        take: 5,
      }),
    }

    // TODO: Call AI service to generate insights
    // For now, return placeholder
    const insights = {
      summary: 'Analisis AI akan tersedia setelah AI service diimplementasikan',
      trends: [],
      recommendations: [],
      generatedAt: new Date().toISOString(),
    }

    // Cache for 1 hour
    await redis.setex(cacheKey, 3600, JSON.stringify(insights))

    return c.json({ data: insights, cached: false })
  } catch (error) {
    console.error('Analytics insights error:', error)
    return c.json({ error: 'Failed to generate insights' }, 500)
  }
})

export default govAnalytics
