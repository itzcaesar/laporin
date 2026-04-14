// ── apps/api/src/routes/categories.ts ──
// Public categories endpoint

import { Hono } from 'hono'
import { db } from '../db.js'
import { redis } from '../lib/redis.js'

const app = new Hono()

/**
 * GET /categories
 * Returns all active categories
 * Cached for 1 hour (categories rarely change)
 */
app.get('/', async (c) => {
  try {
    const cacheKey = 'laporin:categories:all'

    // Try cache
    const cached = await redis.get(cacheKey)
    if (cached) {
      console.log('[Categories] Cache hit')
      return c.json(JSON.parse(cached))
    }

    console.log('[Categories] Cache miss')

    // Get all active categories
    const categories = await db.category.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        emoji: true,
        leadAgency: true,
        defaultPriority: true,
      },
      orderBy: {
        id: 'asc',
      },
    })

    const result = {
      data: categories,
      meta: {
        total: categories.length,
      },
    }

    // Cache for 1 hour
    await redis.setex(cacheKey, 3600, JSON.stringify(result))

    return c.json(result)
  } catch (error) {
    console.error('[Categories] Error fetching categories:', error)
    return c.json(
      {
        error: 'Failed to fetch categories',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    )
  }
})

/**
 * GET /categories/:id
 * Returns a single category by ID
 */
app.get('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'))

    if (isNaN(id)) {
      return c.json(
        {
          error: 'Invalid category ID',
          message: 'Category ID must be a number',
        },
        400
      )
    }

    const cacheKey = `laporin:categories:${id}`

    // Try cache
    const cached = await redis.get(cacheKey)
    if (cached) {
      return c.json(JSON.parse(cached))
    }

    // Get category
    const category = await db.category.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        emoji: true,
        leadAgency: true,
        defaultPriority: true,
        isActive: true,
      },
    })

    if (!category) {
      return c.json(
        {
          error: 'Category not found',
          message: `Category with ID ${id} does not exist`,
        },
        404
      )
    }

    const result = { data: category }

    // Cache for 1 hour
    await redis.setex(cacheKey, 3600, JSON.stringify(result))

    return c.json(result)
  } catch (error) {
    console.error('[Categories] Error fetching category:', error)
    return c.json(
      {
        error: 'Failed to fetch category',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    )
  }
})

/**
 * GET /categories/:id/stats
 * Returns statistics for a specific category
 */
app.get('/:id/stats', async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    const days = parseInt(c.req.query('days') || '30')

    if (isNaN(id)) {
      return c.json(
        {
          error: 'Invalid category ID',
          message: 'Category ID must be a number',
        },
        400
      )
    }

    const cacheKey = `laporin:categories:${id}:stats:${days}`

    // Try cache
    const cached = await redis.get(cacheKey)
    if (cached) {
      return c.json(JSON.parse(cached))
    }

    // Check if category exists
    const category = await db.category.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        emoji: true,
      },
    })

    if (!category) {
      return c.json(
        {
          error: 'Category not found',
          message: `Category with ID ${id} does not exist`,
        },
        404
      )
    }

    // Calculate date threshold
    const dateThreshold = new Date()
    dateThreshold.setDate(dateThreshold.getDate() - days)

    // Get stats
    const [totalReports, resolvedReports, avgDangerLevel] = await Promise.all([
      db.report.count({
        where: {
          categoryId: id,
          createdAt: {
            gte: dateThreshold,
          },
        },
      }),
      db.report.count({
        where: {
          categoryId: id,
          createdAt: {
            gte: dateThreshold,
          },
          status: {
            in: ['completed', 'verified_complete'],
          },
        },
      }),
      db.report.aggregate({
        where: {
          categoryId: id,
          createdAt: {
            gte: dateThreshold,
          },
        },
        _avg: {
          dangerLevel: true,
        },
      }),
    ])

    const resolutionRate =
      totalReports > 0 ? (resolvedReports / totalReports) * 100 : 0

    const result = {
      category: {
        id: category.id,
        name: category.name,
        emoji: category.emoji,
      },
      period: {
        days,
        startDate: dateThreshold.toISOString(),
      },
      stats: {
        totalReports,
        resolvedReports,
        resolutionRate: Math.round(resolutionRate * 10) / 10,
        avgDangerLevel: avgDangerLevel._avg.dangerLevel
          ? Math.round(avgDangerLevel._avg.dangerLevel * 10) / 10
          : 0,
      },
    }

    // Cache for 5 minutes
    await redis.setex(cacheKey, 300, JSON.stringify(result))

    return c.json(result)
  } catch (error) {
    console.error('[Categories] Error fetching category stats:', error)
    return c.json(
      {
        error: 'Failed to fetch category statistics',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    )
  }
})

export default app
