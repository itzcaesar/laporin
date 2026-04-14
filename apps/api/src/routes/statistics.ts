// ── apps/api/src/routes/statistics.ts ──
// Public statistics endpoints for regional data and leaderboards

import { Hono } from 'hono'
import { db } from '../db.js'
import { redis } from '../lib/redis.js'
import type { ReportStatus } from '@prisma/client'

const app = new Hono()

/**
 * Cache TTL for statistics (in seconds)
 */
const CACHE_TTL_STATS = parseInt(process.env.CACHE_TTL_STATS || '300')

/**
 * GET /statistics/region
 * Returns comprehensive statistics for a specific region
 * Cached for 5 minutes
 */
app.get('/region', async (c) => {
  try {
    const regionCode = c.req.query('regionCode')
    const period = c.req.query('period') || '30d' // 30d, 90d, 365d

    if (!regionCode) {
      return c.json(
        {
          error: 'Missing parameter',
          message: 'regionCode is required',
        },
        400
      )
    }

    // Parse period
    const periodDays = period === '365d' ? 365 : period === '90d' ? 90 : 30

    // Generate cache key
    const cacheKey = `laporin:stats:region:${regionCode}:${period}`

    // Try cache
    const cached = await redis.get(cacheKey)
    if (cached) {
      console.log(`[Stats] Cache hit: ${cacheKey}`)
      return c.json(JSON.parse(cached))
    }

    console.log(`[Stats] Cache miss: ${cacheKey}`)

    // Calculate date threshold
    const dateThreshold = new Date()
    dateThreshold.setDate(dateThreshold.getDate() - periodDays)

    // Get total reports in period
    const totalReports = await db.report.count({
      where: {
        regionCode,
        createdAt: {
          gte: dateThreshold,
        },
      },
    })

    // Get resolved reports (completed or verified_complete)
    const resolvedReports = await db.report.count({
      where: {
        regionCode,
        createdAt: {
          gte: dateThreshold,
        },
        status: {
          in: ['completed', 'verified_complete'],
        },
      },
    })

    // Calculate resolution rate
    const resolutionRate =
      totalReports > 0 ? (resolvedReports / totalReports) * 100 : 0

    // Get average days to resolve
    const resolvedWithDates = await db.report.findMany({
      where: {
        regionCode,
        createdAt: {
          gte: dateThreshold,
        },
        status: {
          in: ['completed', 'verified_complete'],
        },
        completedAt: {
          not: null,
        },
      },
      select: {
        createdAt: true,
        completedAt: true,
      },
    })

    let avgDaysToResolve = 0
    if (resolvedWithDates.length > 0) {
      const totalDays = resolvedWithDates.reduce((sum, report) => {
        const days = Math.floor(
          (report.completedAt!.getTime() - report.createdAt.getTime()) /
            (1000 * 60 * 60 * 24)
        )
        return sum + days
      }, 0)
      avgDaysToResolve = Math.round(totalDays / resolvedWithDates.length)
    }

    // Get top categories
    const categoryStats = await db.report.groupBy({
      by: ['categoryId'],
      where: {
        regionCode,
        createdAt: {
          gte: dateThreshold,
        },
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 5,
    })

    // Get category names
    const categoryIds = categoryStats.map((stat) => stat.categoryId)
    const categories = await db.category.findMany({
      where: {
        id: {
          in: categoryIds,
        },
      },
      select: {
        id: true,
        name: true,
        emoji: true,
      },
    })

    const topCategories = categoryStats.map((stat) => {
      const category = categories.find((cat) => cat.id === stat.categoryId)
      return {
        categoryId: stat.categoryId,
        categoryName: category?.name || 'Unknown',
        categoryEmoji: category?.emoji || '📍',
        count: stat._count.id,
      }
    })

    // Get status breakdown
    const statusStats = await db.report.groupBy({
      by: ['status'],
      where: {
        regionCode,
        createdAt: {
          gte: dateThreshold,
        },
      },
      _count: {
        id: true,
      },
    })

    const statusBreakdown: Record<string, number> = {
      new: 0,
      verified: 0,
      in_progress: 0,
      completed: 0,
      verified_complete: 0,
      rejected: 0,
      disputed: 0,
      closed: 0,
    }

    statusStats.forEach((stat) => {
      statusBreakdown[stat.status] = stat._count.id
    })

    // Get average satisfaction rating
    const ratings = await db.satisfactionRating.findMany({
      where: {
        report: {
          regionCode,
          createdAt: {
            gte: dateThreshold,
          },
        },
      },
      select: {
        rating: true,
      },
    })

    const satisfactionAvg =
      ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
        : 0

    // Get region name
    const sampleReport = await db.report.findFirst({
      where: { regionCode },
      select: { regionName: true },
    })

    const result = {
      regionCode,
      regionName: sampleReport?.regionName || regionCode,
      period: {
        days: periodDays,
        label: period,
        startDate: dateThreshold.toISOString(),
      },
      summary: {
        totalReports,
        resolvedCount: resolvedReports,
        resolutionRate: Math.round(resolutionRate * 10) / 10, // 1 decimal
        avgDaysToResolve,
        satisfactionAvg: Math.round(satisfactionAvg * 10) / 10, // 1 decimal
      },
      topCategories,
      statusBreakdown,
    }

    // Cache the result
    await redis.setex(cacheKey, CACHE_TTL_STATS, JSON.stringify(result))

    return c.json(result)
  } catch (error) {
    console.error('[Stats] Error fetching region stats:', error)
    return c.json(
      {
        error: 'Failed to fetch region statistics',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    )
  }
})

/**
 * GET /statistics/leaderboard
 * Returns top 10 regions by resolution rate this month
 * Cached for 10 minutes
 */
app.get('/leaderboard', async (c) => {
  try {
    const cacheKey = 'laporin:stats:leaderboard'

    // Try cache
    const cached = await redis.get(cacheKey)
    if (cached) {
      console.log('[Stats] Leaderboard cache hit')
      return c.json(JSON.parse(cached))
    }

    console.log('[Stats] Leaderboard cache miss')

    // Get start of current month
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    // Get all reports this month grouped by region
    const regionStats = await db.report.groupBy({
      by: ['regionCode', 'regionName'],
      where: {
        createdAt: {
          gte: startOfMonth,
        },
      },
      _count: {
        id: true,
      },
      having: {
        id: {
          _count: {
            gte: 5, // Only regions with at least 5 reports
          },
        },
      },
    })

    // Calculate resolution rate for each region
    const leaderboardData = await Promise.all(
      regionStats.map(async (region) => {
        const totalReports = region._count.id

        const resolvedReports = await db.report.count({
          where: {
            regionCode: region.regionCode,
            createdAt: {
              gte: startOfMonth,
            },
            status: {
              in: ['completed', 'verified_complete'],
            },
          },
        })

        const resolutionRate =
          totalReports > 0 ? (resolvedReports / totalReports) * 100 : 0

        // Get average days to resolve
        const resolvedWithDates = await db.report.findMany({
          where: {
            regionCode: region.regionCode,
            createdAt: {
              gte: startOfMonth,
            },
            status: {
              in: ['completed', 'verified_complete'],
            },
            completedAt: {
              not: null,
            },
          },
          select: {
            createdAt: true,
            completedAt: true,
          },
        })

        let avgDaysToResolve = 0
        if (resolvedWithDates.length > 0) {
          const totalDays = resolvedWithDates.reduce((sum, report) => {
            const days = Math.floor(
              (report.completedAt!.getTime() - report.createdAt.getTime()) /
                (1000 * 60 * 60 * 24)
            )
            return sum + days
          }, 0)
          avgDaysToResolve = Math.round(totalDays / resolvedWithDates.length)
        }

        return {
          regionCode: region.regionCode,
          regionName: region.regionName,
          totalReports,
          resolvedReports,
          resolutionRate: Math.round(resolutionRate * 10) / 10,
          avgDaysToResolve,
        }
      })
    )

    // Sort by resolution rate (desc), then by avg days (asc)
    const leaderboard = leaderboardData
      .sort((a, b) => {
        if (b.resolutionRate !== a.resolutionRate) {
          return b.resolutionRate - a.resolutionRate
        }
        return a.avgDaysToResolve - b.avgDaysToResolve
      })
      .slice(0, 10)

    const result = {
      period: {
        month: now.toLocaleString('id-ID', { month: 'long', year: 'numeric' }),
        startDate: startOfMonth.toISOString(),
      },
      leaderboard,
      meta: {
        totalRegions: regionStats.length,
        minReportsRequired: 5,
      },
    }

    // Cache for 10 minutes
    await redis.setex(cacheKey, 600, JSON.stringify(result))

    return c.json(result)
  } catch (error) {
    console.error('[Stats] Error fetching leaderboard:', error)
    return c.json(
      {
        error: 'Failed to fetch leaderboard',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    )
  }
})

/**
 * GET /statistics/overview
 * Returns overall platform statistics
 * Cached for 5 minutes
 */
app.get('/overview', async (c) => {
  try {
    const cacheKey = 'laporin:stats:overview'

    // Try cache
    const cached = await redis.get(cacheKey)
    if (cached) {
      return c.json(JSON.parse(cached))
    }

    // Get overall counts
    const [
      totalReports,
      totalResolved,
      totalUsers,
      totalOfficers,
      reportsThisMonth,
    ] = await Promise.all([
      db.report.count(),
      db.report.count({
        where: {
          status: {
            in: ['completed', 'verified_complete'],
          },
        },
      }),
      db.user.count({
        where: {
          role: 'citizen',
        },
      }),
      db.user.count({
        where: {
          role: {
            in: ['officer', 'admin'],
          },
        },
      }),
      db.report.count({
        where: {
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
    ])

    // Get average satisfaction
    const allRatings = await db.satisfactionRating.findMany({
      select: {
        rating: true,
      },
    })

    const avgSatisfaction =
      allRatings.length > 0
        ? allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length
        : 0

    const result = {
      totalReports,
      totalResolved,
      totalUsers,
      totalOfficers,
      reportsThisMonth,
      resolutionRate:
        totalReports > 0
          ? Math.round((totalResolved / totalReports) * 1000) / 10
          : 0,
      avgSatisfaction: Math.round(avgSatisfaction * 10) / 10,
      generatedAt: new Date().toISOString(),
    }

    // Cache for 5 minutes
    await redis.setex(cacheKey, CACHE_TTL_STATS, JSON.stringify(result))

    return c.json(result)
  } catch (error) {
    console.error('[Stats] Error fetching overview:', error)
    return c.json(
      {
        error: 'Failed to fetch overview statistics',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    )
  }
})

/**
 * GET /statistics/trends
 * Returns time-series data for reports over time
 * Cached for 5 minutes
 */
app.get('/trends', async (c) => {
  try {
    const days = parseInt(c.req.query('days') || '30')
    const regionCode = c.req.query('regionCode') // Optional

    const cacheKey = `laporin:stats:trends:${days}:${regionCode || 'all'}`

    // Try cache
    const cached = await redis.get(cacheKey)
    if (cached) {
      return c.json(JSON.parse(cached))
    }

    // Calculate date threshold
    const dateThreshold = new Date()
    dateThreshold.setDate(dateThreshold.getDate() - days)

    // Get daily report counts
    const dailyStats = await db.$queryRaw<
      Array<{ date: string; count: number; resolved: number }>
    >`
      SELECT 
        DATE(created_at) as date,
        CAST(COUNT(*) AS INTEGER) as count,
        CAST(SUM(CASE WHEN status IN ('completed', 'verified_complete') THEN 1 ELSE 0 END) AS INTEGER) as resolved
      FROM reports
      WHERE 
        created_at >= ${dateThreshold}
        ${regionCode ? db.$queryRaw`AND region_code = ${regionCode}` : db.$queryRaw``}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `

    const result = {
      period: {
        days,
        startDate: dateThreshold.toISOString(),
      },
      data: dailyStats.map((stat) => ({
        date: stat.date,
        totalReports: stat.count,
        resolvedReports: stat.resolved,
        resolutionRate:
          stat.count > 0
            ? Math.round((stat.resolved / stat.count) * 1000) / 10
            : 0,
      })),
    }

    // Cache for 5 minutes
    await redis.setex(cacheKey, CACHE_TTL_STATS, JSON.stringify(result))

    return c.json(result)
  } catch (error) {
    console.error('[Stats] Error fetching trends:', error)
    return c.json(
      {
        error: 'Failed to fetch trend data',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    )
  }
})

export default app
