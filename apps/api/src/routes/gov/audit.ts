import { Hono } from 'hono'
import { db } from '../../db.js'
import { authMiddleware, type AuthVariables } from '../../middleware/auth.js'
import { paginated, err } from '../../lib/response.js'
import { buildMeta } from '../../lib/pagination.js'

const audit = new Hono<{ Variables: AuthVariables }>()

// All routes require authentication
audit.use('*', authMiddleware)

/**
 * GET /gov/audit
 * Get audit logs (only for super_admin or admin)
 */
audit.get('/', async (c) => {
  const user = c.get('user')
  
  if (user.role !== 'admin' && user.role !== 'super_admin') {
    return err(c, 'FORBIDDEN', 'Hanya admin yang dapat melihat log audit', 403)
  }

  const query = c.req.query()
  const page = parseInt(query.page || '1', 10)
  const limit = parseInt(query.limit || '20', 10)
  const skip = (page - 1) * limit

  try {
    const [items, total] = await Promise.all([
      db.auditLog.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          actor: {
            select: {
              name: true,
              role: true,
            },
          },
        },
      }),
      db.auditLog.count(),
    ])

    const data = items.map((log) => ({
      id: log.id,
      action: log.action,
      entityType: log.targetType,
      entityId: log.targetId,
      actorId: log.actorId,
      actorName: log.actor?.name || 'System',
      actorRole: log.actor?.role || 'system',
      details: log.metadata,
      createdAt: log.createdAt.toISOString(),
    }))

    return paginated(c, data, buildMeta(total, { page, limit }))
  } catch (error) {
    console.error('Get audit logs error:', error)
    return err(c, 'INTERNAL_ERROR', 'Gagal memuat log audit', 500)
  }
})

export default audit
