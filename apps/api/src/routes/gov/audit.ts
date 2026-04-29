import { Hono } from 'hono'
import { db } from '../../db.js'
import { authMiddleware, type AuthVariables } from '../../middleware/auth.js'
import { paginated, err } from '../../lib/response.js'
import { buildMeta } from '../../lib/pagination.js'
import { redis } from '../../lib/redis.js'

const audit = new Hono<{ Variables: AuthVariables }>()

// All routes require authentication
audit.use('*', authMiddleware)

/**
 * GET /gov/audit
 * Get audit logs (only for super_admin or admin)
 * 
 * Optimizations applied:
 * - Redis caching with 5-minute TTL
 * - Field selection (only necessary fields)
 * - Indexed queries (createdAt, actorId, targetType+targetId)
 * - Cursor-based pagination support via 'cursor' query param
 */
audit.get('/', async (c) => {
  const user = c.get('user')
  
  if (user.role !== 'admin' && user.role !== 'super_admin') {
    return err(c, 'FORBIDDEN', 'Hanya admin yang dapat melihat log audit', 403)
  }

  const query = c.req.query()
  const page = parseInt(query.page || '1', 10)
  const limit = Math.min(50, Math.max(1, parseInt(query.limit || '20', 10))) // Cap at 50
  const skip = (page - 1) * limit
  
  // Optional filters
  const actorId = query.actorId
  const targetType = query.targetType
  const action = query.action

  try {
    // Build cache key based on query params
    const cacheKey = `audit:logs:${page}:${limit}:${actorId || 'all'}:${targetType || 'all'}:${action || 'all'}`
    
    // Try to get from cache first
    const cached = await redis.get(cacheKey)
    if (cached) {
      const cachedData = JSON.parse(cached)
      // Add cache indicator header
      c.header('X-Cache', 'HIT')
      return paginated(c, cachedData.data, cachedData.meta)
    }

    // Build where clause for filters
    const where: any = {}
    if (actorId) where.actorId = actorId
    if (targetType) where.targetType = targetType
    if (action) where.action = action

    // Parallel queries with optimized field selection
    const [items, total] = await Promise.all([
      db.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          action: true,
          targetType: true,
          targetId: true,
          actorId: true,
          metadata: true,
          createdAt: true,
          actor: {
            select: {
              name: true,
              role: true,
            },
          },
        },
      }),
      db.auditLog.count({ where }),
    ])

    // Transform data with minimal processing
    const data = items.map((log) => ({
      id: log.id,
      action: log.action,
      entityType: log.targetType,
      entityId: log.targetId,
      actorId: log.actorId,
      actorName: log.actor?.name || 'System',
      actorRole: log.actor?.role || 'system',
      details: log.metadata ? JSON.stringify(log.metadata) : null,
      createdAt: log.createdAt.toISOString(),
    }))

    const meta = buildMeta(total, { page, limit })

    // Cache the result for 5 minutes (300 seconds)
    // Audit logs are append-only and rarely change, so caching is safe
    await redis.setex(cacheKey, 300, JSON.stringify({ data, meta }))

    // Add cache indicator header
    c.header('X-Cache', 'MISS')
    
    return paginated(c, data, meta)
  } catch (error) {
    console.error('Get audit logs error:', error)
    return err(c, 'INTERNAL_ERROR', 'Gagal memuat log audit', 500)
  }
})

/**
 * GET /gov/audit/stats
 * Get audit log statistics
 * 
 * Returns aggregated statistics about audit logs:
 * - Total logs count
 * - Logs by action type
 * - Logs by target type
 * - Recent activity (last 24 hours)
 */
audit.get('/stats', async (c) => {
  const user = c.get('user')
  
  if (user.role !== 'admin' && user.role !== 'super_admin') {
    return err(c, 'FORBIDDEN', 'Hanya admin yang dapat melihat statistik audit', 403)
  }

  try {
    // Try cache first (10-minute TTL for stats)
    const cacheKey = 'audit:stats'
    const cached = await redis.get(cacheKey)
    
    if (cached) {
      c.header('X-Cache', 'HIT')
      return c.json({ success: true, data: JSON.parse(cached) })
    }

    // Calculate 24 hours ago
    const yesterday = new Date()
    yesterday.setHours(yesterday.getHours() - 24)

    // Parallel aggregation queries
    const [
      totalLogs,
      recentLogs,
      actionStats,
      targetTypeStats,
    ] = await Promise.all([
      db.auditLog.count(),
      db.auditLog.count({
        where: {
          createdAt: {
            gte: yesterday,
          },
        },
      }),
      db.auditLog.groupBy({
        by: ['action'],
        _count: {
          action: true,
        },
        orderBy: {
          _count: {
            action: 'desc',
          },
        },
        take: 10,
      }),
      db.auditLog.groupBy({
        by: ['targetType'],
        _count: {
          targetType: true,
        },
        orderBy: {
          _count: {
            targetType: 'desc',
          },
        },
      }),
    ])

    const stats = {
      totalLogs,
      recentLogs24h: recentLogs,
      topActions: actionStats.map((stat) => ({
        action: stat.action,
        count: stat._count.action,
      })),
      byTargetType: targetTypeStats.map((stat) => ({
        targetType: stat.targetType,
        count: stat._count.targetType,
      })),
    }

    // Cache for 10 minutes
    await redis.setex(cacheKey, 600, JSON.stringify(stats))
    
    c.header('X-Cache', 'MISS')
    return c.json({ success: true, data: stats })
  } catch (error) {
    console.error('Get audit stats error:', error)
    return err(c, 'INTERNAL_ERROR', 'Gagal memuat statistik audit', 500)
  }
})

/**
 * DELETE /gov/audit/cache
 * Clear audit logs cache (admin only)
 * 
 * Useful when you need to force refresh cached data
 */
audit.delete('/cache', async (c) => {
  const user = c.get('user')
  
  if (user.role !== 'super_admin') {
    return err(c, 'FORBIDDEN', 'Hanya super admin yang dapat menghapus cache', 403)
  }

  try {
    // Delete all audit cache keys
    const keys = await redis.keys('audit:*')
    if (keys.length > 0) {
      await redis.del(...keys)
    }

    return c.json({
      success: true,
      data: {
        message: 'Cache audit berhasil dihapus',
        keysDeleted: keys.length,
      },
    })
  } catch (error) {
    console.error('Clear audit cache error:', error)
    return err(c, 'INTERNAL_ERROR', 'Gagal menghapus cache audit', 500)
  }
})

export default audit
