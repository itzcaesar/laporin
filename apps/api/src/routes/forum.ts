// ── apps/api/src/routes/forum.ts ──
// Forum/community discussion endpoints

import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { db } from '../db.js'
import { authMiddleware, type AuthVariables } from '../middleware/auth.js'
import { ok, paginated, err } from '../lib/response.js'
import { getPagination, getSkip, buildMeta } from '../lib/pagination.js'

const forum = new Hono<{ Variables: AuthVariables }>()

// Validation schemas
const createThreadSchema = z.object({
  title: z.string().min(10).max(200),
  content: z.string().min(20).max(5000),
  category: z.enum(['Diskusi Umum', 'Tips & Trik', 'Apresiasi', 'Pertanyaan', 'Keluhan']),
})

const createReplySchema = z.object({
  content: z.string().min(10).max(2000),
})

const threadIdSchema = z.object({
  id: z.string().uuid(),
})

/**
 * GET /forum
 * Get forum threads list with pagination and filters
 */
forum.get('/', async (c) => {
  const query = c.req.query()
  const page = parseInt(query.page || '1', 10)
  const limit = parseInt(query.limit || '20', 10)
  const skip = getSkip({ page, limit })
  const category = query.category
  const sortBy = query.sortBy || 'recent' // recent, popular, trending

  try {
    const where: any = {}
    if (category && category !== 'Semua') {
      where.category = category
    }

    let orderBy: any = { lastActivityAt: 'desc' }
    if (sortBy === 'popular') {
      orderBy = { upvoteCount: 'desc' }
    } else if (sortBy === 'trending') {
      orderBy = { viewCount: 'desc' }
    }

    const [items, total] = await Promise.all([
      db.forumThread.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { isPinned: 'desc' }, // Pinned threads first
          orderBy,
        ],
        include: {
          author: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              replies: true,
            },
          },
        },
      }),
      db.forumThread.count({ where }),
    ])

    const data = items.map((thread) => ({
      id: thread.id,
      title: thread.title,
      content: thread.content.substring(0, 200) + (thread.content.length > 200 ? '...' : ''),
      category: thread.category,
      author: {
        name: thread.author.name || 'Anonim',
        reputation: 0, // TODO: Calculate from user activity
      },
      replies: thread._count.replies,
      views: thread.viewCount,
      upvotes: thread.upvoteCount,
      isPinned: thread.isPinned,
      isLocked: thread.isLocked,
      lastActivity: thread.lastActivityAt.toISOString(),
      createdAt: thread.createdAt.toISOString(),
    }))

    return paginated(c, data, buildMeta(total, { page, limit }))
  } catch (error) {
    console.error('Get forum threads error:', error)
    return err(c, 'INTERNAL_ERROR', 'Gagal memuat forum', 500)
  }
})

/**
 * GET /forum/:id
 * Get single forum thread with replies
 */
forum.get('/:id', zValidator('param', threadIdSchema), async (c) => {
  const { id } = c.req.valid('param')

  try {
    // Increment view count
    await db.forumThread.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    })

    const thread = await db.forumThread.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
          },
        },
        replies: {
          orderBy: { createdAt: 'asc' },
          include: {
            author: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    })

    if (!thread) {
      return err(c, 'THREAD_NOT_FOUND', 'Thread tidak ditemukan', 404)
    }

    const data = {
      id: thread.id,
      title: thread.title,
      content: thread.content,
      category: thread.category,
      author: {
        id: thread.author.id,
        name: thread.author.name || 'Anonim',
        reputation: 0, // TODO: Calculate
      },
      replies: thread.replies.map((reply) => ({
        id: reply.id,
        content: reply.content,
        author: {
          id: reply.author.id,
          name: reply.author.name || 'Anonim',
        },
        upvotes: reply.upvoteCount,
        createdAt: reply.createdAt.toISOString(),
      })),
      views: thread.viewCount,
      upvotes: thread.upvoteCount,
      isPinned: thread.isPinned,
      isLocked: thread.isLocked,
      createdAt: thread.createdAt.toISOString(),
      updatedAt: thread.updatedAt.toISOString(),
    }

    return ok(c, data)
  } catch (error) {
    console.error('Get forum thread error:', error)
    return err(c, 'INTERNAL_ERROR', 'Gagal memuat thread', 500)
  }
})

/**
 * POST /forum
 * Create new forum thread (authenticated users only)
 */
forum.post('/', authMiddleware, zValidator('json', createThreadSchema), async (c) => {
  const currentUser = c.get('user')
  const { title, content, category } = c.req.valid('json')

  try {
    const thread = await db.forumThread.create({
      data: {
        authorId: currentUser.sub,
        title,
        content,
        category,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return ok(c, {
      id: thread.id,
      title: thread.title,
      content: thread.content,
      category: thread.category,
      author: {
        id: thread.author.id,
        name: thread.author.name || 'Anonim',
      },
      createdAt: thread.createdAt.toISOString(),
    })
  } catch (error) {
    console.error('Create forum thread error:', error)
    return err(c, 'INTERNAL_ERROR', 'Gagal membuat thread', 500)
  }
})

/**
 * POST /forum/:id/replies
 * Add reply to forum thread (authenticated users only)
 */
forum.post(
  '/:id/replies',
  authMiddleware,
  zValidator('param', threadIdSchema),
  zValidator('json', createReplySchema),
  async (c) => {
    const currentUser = c.get('user')
    const { id } = c.req.valid('param')
    const { content } = c.req.valid('json')

    try {
      // Check if thread exists and is not locked
      const thread = await db.forumThread.findUnique({
        where: { id },
        select: { isLocked: true },
      })

      if (!thread) {
        return err(c, 'THREAD_NOT_FOUND', 'Thread tidak ditemukan', 404)
      }

      if (thread.isLocked) {
        return err(c, 'THREAD_LOCKED', 'Thread ini telah dikunci', 403)
      }

      // Create reply
      const reply = await db.forumReply.create({
        data: {
          threadId: id,
          authorId: currentUser.sub,
          content,
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      })

      // Update thread reply count and last activity
      await db.forumThread.update({
        where: { id },
        data: {
          replyCount: { increment: 1 },
          lastActivityAt: new Date(),
        },
      })

      return ok(c, {
        id: reply.id,
        content: reply.content,
        author: {
          id: reply.author.id,
          name: reply.author.name || 'Anonim',
        },
        createdAt: reply.createdAt.toISOString(),
      })
    } catch (error) {
      console.error('Create forum reply error:', error)
      return err(c, 'INTERNAL_ERROR', 'Gagal menambahkan balasan', 500)
    }
  }
)

/**
 * POST /forum/:id/vote
 * Upvote a forum thread (authenticated users only)
 */
forum.post('/:id/vote', authMiddleware, zValidator('param', threadIdSchema), async (c) => {
  const currentUser = c.get('user')
  const { id } = c.req.valid('param')

  try {
    // Check if already voted
    const existingVote = await db.forumThreadVote.findUnique({
      where: {
        threadId_userId: {
          threadId: id,
          userId: currentUser.sub,
        },
      },
    })

    if (existingVote) {
      return err(c, 'ALREADY_VOTED', 'Anda sudah memberikan vote', 400)
    }

    // Create vote
    await db.forumThreadVote.create({
      data: {
        threadId: id,
        userId: currentUser.sub,
      },
    })

    // Increment upvote count
    const updatedThread = await db.forumThread.update({
      where: { id },
      data: {
        upvoteCount: { increment: 1 },
      },
      select: {
        upvoteCount: true,
      },
    })

    return ok(c, {
      upvoteCount: updatedThread.upvoteCount,
    })
  } catch (error) {
    console.error('Vote forum thread error:', error)
    return err(c, 'INTERNAL_ERROR', 'Gagal memberikan vote', 500)
  }
})

/**
 * DELETE /forum/:id/vote
 * Remove upvote from forum thread
 */
forum.delete('/:id/vote', authMiddleware, zValidator('param', threadIdSchema), async (c) => {
  const currentUser = c.get('user')
  const { id } = c.req.valid('param')

  try {
    const deleted = await db.forumThreadVote.deleteMany({
      where: {
        threadId: id,
        userId: currentUser.sub,
      },
    })

    if (deleted.count === 0) {
      return err(c, 'VOTE_NOT_FOUND', 'Vote tidak ditemukan', 404)
    }

    // Decrement upvote count
    const updatedThread = await db.forumThread.update({
      where: { id },
      data: {
        upvoteCount: { decrement: 1 },
      },
      select: {
        upvoteCount: true,
      },
    })

    return ok(c, {
      upvoteCount: updatedThread.upvoteCount,
    })
  } catch (error) {
    console.error('Remove vote error:', error)
    return err(c, 'INTERNAL_ERROR', 'Gagal menghapus vote', 500)
  }
})

/**
 * PATCH /forum/:id/pin
 * Toggle pin status of a thread (officers only)
 */
forum.patch('/:id/pin', authMiddleware, async (c) => {
  const currentUser = c.get('user')
  const id = c.req.param('id')

  if (currentUser.role === 'citizen') {
    return err(c, 'ACCESS_DENIED', 'Hanya petugas yang dapat menyematkan thread', 403)
  }

  try {
    const thread = await db.forumThread.findUnique({
      where: { id },
      select: { isPinned: true },
    })

    if (!thread) {
      return err(c, 'THREAD_NOT_FOUND', 'Thread tidak ditemukan', 404)
    }

    const updated = await db.forumThread.update({
      where: { id },
      data: { isPinned: !thread.isPinned },
    })

    return ok(c, { isPinned: updated.isPinned })
  } catch (error) {
    console.error('Toggle pin error:', error)
    return err(c, 'INTERNAL_ERROR', 'Gagal menyematkan thread', 500)
  }
})

/**
 * PATCH /forum/:id/lock
 * Toggle lock status of a thread (officers only)
 */
forum.patch('/:id/lock', authMiddleware, async (c) => {
  const currentUser = c.get('user')
  const id = c.req.param('id')

  if (currentUser.role === 'citizen') {
    return err(c, 'ACCESS_DENIED', 'Hanya petugas yang dapat mengunci thread', 403)
  }

  try {
    const thread = await db.forumThread.findUnique({
      where: { id },
      select: { isLocked: true },
    })

    if (!thread) {
      return err(c, 'THREAD_NOT_FOUND', 'Thread tidak ditemukan', 404)
    }

    const updated = await db.forumThread.update({
      where: { id },
      data: { isLocked: !thread.isLocked },
    })

    return ok(c, { isLocked: updated.isLocked })
  } catch (error) {
    console.error('Toggle lock error:', error)
    return err(c, 'INTERNAL_ERROR', 'Gagal mengunci thread', 500)
  }
})

/**
 * DELETE /forum/:id
 * Delete a forum thread (officers or author only)
 */
forum.delete('/:id', authMiddleware, async (c) => {
  const currentUser = c.get('user')
  const id = c.req.param('id')

  try {
    const thread = await db.forumThread.findUnique({
      where: { id },
      select: { authorId: true },
    })

    if (!thread) {
      return err(c, 'THREAD_NOT_FOUND', 'Thread tidak ditemukan', 404)
    }

    // Check permissions: officer/admin OR thread author
    const isOfficer = currentUser.role !== 'citizen'
    const isAuthor = thread.authorId === currentUser.sub

    if (!isOfficer && !isAuthor) {
      return err(c, 'ACCESS_DENIED', 'Akses ditolak', 403)
    }

    await db.forumThread.delete({
      where: { id },
    })

    return ok(c, { success: true })
  } catch (error) {
    console.error('Delete forum thread error:', error)
    return err(c, 'INTERNAL_ERROR', 'Gagal menghapus thread', 500)
  }
})

export default forum
