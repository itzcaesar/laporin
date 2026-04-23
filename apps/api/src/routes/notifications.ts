// ── apps/api/src/routes/notifications.ts ──
// Notification endpoints for authenticated users

import { Hono } from 'hono'
import { db } from '../db.js'
import { authMiddleware, type AuthVariables } from '../middleware/auth.js'

const notifications = new Hono<{ Variables: AuthVariables }>()

// All notification routes require authentication
notifications.use('*', authMiddleware)

/**
 * GET /notifications
 * List user notifications with pagination
 */
notifications.get('/', async (c) => {
  const user = c.get('user')
  const page = parseInt(c.req.query('page') ?? '1', 10)
  const limit = Math.min(parseInt(c.req.query('limit') ?? '20', 10), 50)
  const skip = (page - 1) * limit

  try {
    const [items, total] = await Promise.all([
      db.notification.findMany({
        where: { userId: user.sub },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          report: { select: { trackingCode: true } },
        },
      }),
      db.notification.count({ where: { userId: user.sub } }),
    ])

    return c.json({
      success: true,
      data: items.map((n) => ({
        id: n.id,
        title: n.title,
        body: n.body,
        isRead: n.isRead,
        reportId: n.reportId,
        trackingCode: n.report?.trackingCode ?? null,
        createdAt: n.createdAt.toISOString(),
      })),
      meta: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('List notifications error:', error)
    return c.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Gagal memuat notifikasi',
        },
      },
      500
    )
  }
})

/**
 * GET /notifications/unread-count
 * Get count of unread notifications
 */
notifications.get('/unread-count', async (c) => {
  const user = c.get('user')

  try {
    const count = await db.notification.count({
      where: { userId: user.sub, isRead: false },
    })

    return c.json({
      success: true,
      data: { count },
    })
  } catch (error) {
    console.error('Unread count error:', error)
    return c.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Gagal memuat jumlah notifikasi',
        },
      },
      500
    )
  }
})

/**
 * PATCH /notifications/read-all
 * Mark all notifications as read
 */
notifications.patch('/read-all', async (c) => {
  const user = c.get('user')

  try {
    await db.notification.updateMany({
      where: { userId: user.sub, isRead: false },
      data: { isRead: true },
    })

    return c.json({ success: true, data: null })
  } catch (error) {
    console.error('Mark all read error:', error)
    return c.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Gagal menandai notifikasi',
        },
      },
      500
    )
  }
})

/**
 * PATCH /notifications/:id/read
 * Mark a single notification as read
 */
notifications.patch('/:id/read', async (c) => {
  const user = c.get('user')
  const { id } = c.req.param()

  try {
    const notification = await db.notification.findFirst({
      where: { id, userId: user.sub },
    })

    if (!notification) {
      return c.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Notifikasi tidak ditemukan',
          },
        },
        404
      )
    }

    await db.notification.update({
      where: { id },
      data: { isRead: true },
    })

    return c.json({ success: true, data: null })
  } catch (error) {
    console.error('Mark read error:', error)
    return c.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Gagal menandai notifikasi',
        },
      },
      500
    )
  }
})

export default notifications
