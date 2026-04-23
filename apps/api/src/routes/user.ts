// ── apps/api/src/routes/user.ts ──
// User-specific endpoints (my reports, bookmarks, profile)

import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { db } from '../db.js'
import { authMiddleware, type AuthVariables } from '../middleware/auth.js'
import { ok, paginated, err } from '../lib/response.js'
import { getPagination, getSkip, buildMeta } from '../lib/pagination.js'

const user = new Hono<{ Variables: AuthVariables }>()

// All routes require authentication
user.use('*', authMiddleware)

/**
 * GET /user/reports
 * Get current user's own reports
 */
user.get('/reports', async (c) => {
  const currentUser = c.get('user')
  const query = c.req.query()
  const page = parseInt(query.page || '1', 10)
  const limit = parseInt(query.limit || '20', 10)
  const skip = (page - 1) * limit

  try {
    const where = {
      reporterId: currentUser.sub,
    }

    const [items, total] = await Promise.all([
      db.report.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          category: { select: { id: true, name: true, emoji: true } },
          agency: { select: { id: true, name: true } },
          media: { where: { sortOrder: 0 }, take: 1 },
          _count: { select: { comments: true } },
        },
      }),
      db.report.count({ where }),
    ])

    const data = items.map((r) => ({
      id: r.id,
      trackingCode: r.trackingCode,
      title: r.title,
      locationAddress: r.locationAddress,
      locationLat: Number(r.locationLat),
      locationLng: Number(r.locationLng),
      status: r.status,
      priority: r.priority,
      dangerLevel: r.dangerLevel,
      priorityScore: r.priorityScore,
      upvoteCount: r.upvoteCount,
      commentCount: r._count.comments,
      categoryId: r.category.id,
      isAnonymous: r.isAnonymous,
      reporterName: null,
      agencyId: r.agencyId,
      agencyName: r.agency?.name ?? null,
      picName: null,
      picNip: r.picNip,
      estimatedEnd: r.estimatedEnd?.toISOString() ?? null,
      budgetIdr: r.budgetIdr ? Number(r.budgetIdr) : null,
      thumbnailUrl: r.media[0]?.fileUrl ?? null,
      hasVoted: false,
      hasBookmarked: false,
      aiSummary: r.aiSummary ?? null,
      aiAnalysis: null,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }))

    return paginated(c, data, buildMeta(total, { page, limit }))
  } catch (error) {
    console.error('Get user reports error:', error)
    return err(c, 'INTERNAL_ERROR', 'Gagal memuat laporan Anda', 500)
  }
})

/**
 * GET /user/bookmarks
 * Get current user's bookmarked reports
 */
user.get('/bookmarks', async (c) => {
  const currentUser = c.get('user')
  const query = c.req.query()
  const page = parseInt(query.page || '1', 10)
  const limit = parseInt(query.limit || '20', 10)
  const skip = (page - 1) * limit

  try {
    const [bookmarks, total] = await Promise.all([
      db.bookmark.findMany({
        where: { userId: currentUser.sub },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          report: {
            include: {
              category: { select: { id: true, name: true, emoji: true } },
              agency: { select: { id: true, name: true } },
              media: { where: { sortOrder: 0 }, take: 1 },
              _count: { select: { comments: true } },
            },
          },
        },
      }),
      db.bookmark.count({ where: { userId: currentUser.sub } }),
    ])

    const data = bookmarks.map((b) => {
      const r = b.report
      return {
        id: r.id,
        trackingCode: r.trackingCode,
        title: r.title,
        locationAddress: r.locationAddress,
        locationLat: Number(r.locationLat),
        locationLng: Number(r.locationLng),
        status: r.status,
        priority: r.priority,
        dangerLevel: r.dangerLevel,
        priorityScore: r.priorityScore,
        upvoteCount: r.upvoteCount,
        commentCount: r._count.comments,
        categoryId: r.category.id,
        isAnonymous: r.isAnonymous,
        reporterName: null,
        agencyId: r.agencyId,
        agencyName: r.agency?.name ?? null,
        picName: null,
        picNip: r.picNip,
        estimatedEnd: r.estimatedEnd?.toISOString() ?? null,
        budgetIdr: r.budgetIdr ? Number(r.budgetIdr) : null,
        thumbnailUrl: r.media[0]?.fileUrl ?? null,
        hasVoted: false,
        hasBookmarked: true,
        aiSummary: r.aiSummary ?? null,
        aiAnalysis: null,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      }
    })

    return paginated(c, data, buildMeta(total, { page, limit }))
  } catch (error) {
    console.error('Get bookmarks error:', error)
    return err(c, 'INTERNAL_ERROR', 'Gagal memuat bookmark', 500)
  }
})

/**
 * POST /user/bookmarks/:reportId
 * Add a report to bookmarks
 */
user.post('/bookmarks/:reportId', async (c) => {
  const currentUser = c.get('user')
  const reportId = c.req.param('reportId')

  try {
    // Check if report exists
    const report = await db.report.findUnique({
      where: { id: reportId },
      select: { id: true },
    })

    if (!report) {
      return err(c, 'REPORT_NOT_FOUND', 'Laporan tidak ditemukan', 404)
    }

    // Check if already bookmarked
    const existing = await db.bookmark.findUnique({
      where: {
        reportId_userId: {
          reportId,
          userId: currentUser.sub,
        },
      },
    })

    if (existing) {
      return err(c, 'ALREADY_BOOKMARKED', 'Laporan sudah di-bookmark', 400)
    }

    // Create bookmark
    await db.bookmark.create({
      data: {
        reportId,
        userId: currentUser.sub,
      },
    })

    return ok(c, { success: true })
  } catch (error) {
    console.error('Add bookmark error:', error)
    return err(c, 'INTERNAL_ERROR', 'Gagal menambahkan bookmark', 500)
  }
})

/**
 * DELETE /user/bookmarks/:reportId
 * Remove a report from bookmarks
 */
user.delete('/bookmarks/:reportId', async (c) => {
  const currentUser = c.get('user')
  const reportId = c.req.param('reportId')

  try {
    const deleted = await db.bookmark.deleteMany({
      where: {
        reportId,
        userId: currentUser.sub,
      },
    })

    if (deleted.count === 0) {
      return err(c, 'BOOKMARK_NOT_FOUND', 'Bookmark tidak ditemukan', 404)
    }

    return ok(c, { success: true })
  } catch (error) {
    console.error('Remove bookmark error:', error)
    return err(c, 'INTERNAL_ERROR', 'Gagal menghapus bookmark', 500)
  }
})

/**
 * GET /user/notifications
 * Get current user's notifications
 */
user.get('/notifications', async (c) => {
  const currentUser = c.get('user')
  const query = c.req.query()
  const page = parseInt(query.page || '1', 10)
  const limit = parseInt(query.limit || '20', 10)
  const skip = (page - 1) * limit

  try {
    const [items, total] = await Promise.all([
      db.notification.findMany({
        where: { userId: currentUser.sub },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          report: {
            select: {
              id: true,
              trackingCode: true,
              title: true,
            },
          },
        },
      }),
      db.notification.count({ where: { userId: currentUser.sub } }),
    ])

    const data = items.map((n) => ({
      id: n.id,
      title: n.title,
      body: n.body,
      isRead: n.isRead,
      reportId: n.reportId,
      reportTitle: n.report?.title ?? null,
      reportTrackingCode: n.report?.trackingCode ?? null,
      createdAt: n.createdAt.toISOString(),
    }))

    return paginated(c, data, buildMeta(total, { page, limit }))
  } catch (error) {
    console.error('Get notifications error:', error)
    return err(c, 'INTERNAL_ERROR', 'Gagal memuat notifikasi', 500)
  }
})

/**
 * GET /user/notifications/unread-count
 * Get total count of unread notifications
 */
user.get('/notifications/unread-count', async (c) => {
  const currentUser = c.get('user')

  try {
    const count = await db.notification.count({
      where: {
        userId: currentUser.sub,
        isRead: false,
      },
    })

    return ok(c, { count })
  } catch (error) {
    console.error('Get unread count error:', error)
    return err(c, 'INTERNAL_ERROR', 'Gagal memuat jumlah notifikasi', 500)
  }
})

/**
 * PATCH /user/notifications/read-all
 * Mark all notifications as read
 */
user.patch('/notifications/read-all', async (c) => {
  const currentUser = c.get('user')

  try {
    await db.notification.updateMany({
      where: {
        userId: currentUser.sub,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    })

    return ok(c, { success: true })
  } catch (error) {
    console.error('Mark all read error:', error)
    return err(c, 'INTERNAL_ERROR', 'Gagal menandai notifikasi', 500)
  }
})

/**
 * PATCH /user/notifications/:id/read
 * Mark a single notification as read
 */
user.patch('/notifications/:id/read', async (c) => {
  const currentUser = c.get('user')
  const notificationId = c.req.param('id')

  try {
    const notification = await db.notification.findUnique({
      where: { id: notificationId },
      select: { userId: true },
    })

    if (!notification) {
      return err(c, 'NOTIFICATION_NOT_FOUND', 'Notifikasi tidak ditemukan', 404)
    }

    if (notification.userId !== currentUser.sub) {
      return err(c, 'ACCESS_DENIED', 'Akses ditolak', 403)
    }

    await db.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    })

    return ok(c, { success: true })
  } catch (error) {
    console.error('Mark notification read error:', error)
    return err(c, 'INTERNAL_ERROR', 'Gagal menandai notifikasi', 500)
  }
})

/**
 * GET /user/profile
 * Get current user's profile
 */
user.get('/profile', async (c) => {
  const currentUser = c.get('user')

  try {
    const profile = await db.user.findUnique({
      where: { id: currentUser.sub },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        nip: true,
        isVerified: true,
        createdAt: true,
        agency: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
        _count: {
          select: {
            reports: true,
            comments: true,
            votes: true,
          },
        },
      },
    })

    if (!profile) {
      return err(c, 'USER_NOT_FOUND', 'Pengguna tidak ditemukan', 404)
    }

    return ok(c, {
      id: profile.id,
      name: profile.name,
      email: profile.email,
      phone: profile.phone,
      role: profile.role,
      nip: profile.nip,
      isVerified: profile.isVerified,
      agency: profile.agency,
      stats: {
        totalReports: profile._count.reports,
        totalComments: profile._count.comments,
        totalVotes: profile._count.votes,
      },
      createdAt: profile.createdAt.toISOString(),
    })
  } catch (error) {
    console.error('Get profile error:', error)
    return err(c, 'INTERNAL_ERROR', 'Gagal memuat profil', 500)
  }
})

/**
 * PATCH /user/profile
 * Update current user's profile
 */
const updateProfileSchema = z.object({
  name: z.string().min(3).max(100).optional(),
  phone: z.string().min(10).max(20).optional(),
})

user.patch(
  '/profile',
  zValidator('json', updateProfileSchema),
  async (c) => {
    const currentUser = c.get('user')
    const body = c.req.valid('json')

    try {
      const updated = await db.user.update({
        where: { id: currentUser.sub },
        data: {
          name: body.name,
          phone: body.phone,
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
        },
      })

      return ok(c, updated)
    } catch (error) {
      console.error('Update profile error:', error)
      return err(c, 'INTERNAL_ERROR', 'Gagal memperbarui profil', 500)
    }
  }
)

export default user
