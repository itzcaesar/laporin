// ── apps/api/src/routes/reports.ts ──
// Citizen-facing report endpoints

import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { db } from '../db.js'
import { authMiddleware, optionalAuthMiddleware, type AuthVariables } from '../middleware/auth.js'
import { generateTrackingCode } from '../lib/trackingCode.js'
import { calculatePriorityScore } from '../lib/priorityScore.js'
import { generateUploadUrl, getPublicUrl } from '../services/storage.service.js'
import { addAIAnalysisJob } from '../jobs/queue.js'
import {
  reportListSelect,
  reportDetailInclude,
  buildReportWhereClause,
  buildOrderByClause,
  calculatePagination,
} from '../lib/queryHelpers.js'
import {
  createReportSchema,
  listReportsSchema,
  requestUploadUrlSchema,
  confirmMediaUploadSchema,
  createCommentSchema,
  createRatingSchema,
  verifyCompleteSchema,
  reportIdSchema,
} from '../validators/report.validator.js'

const reports = new Hono<{ Variables: AuthVariables }>()

/**
 * GET /reports
 * List reports with filters and pagination (optimized)
 */
reports.get('/', zValidator('query', listReportsSchema), async (c) => {
  const {
    page,
    limit,
    status,
    categoryId,
    regionCode,
    priority,
    search,
    sortBy,
    sortOrder,
  } = c.req.valid('query')

  try {
    // Build optimized where clause
    const where = buildReportWhereClause({
      status,
      categoryId,
      regionCode,
      priority,
      search,
    })

    // Build order by clause
    const orderBy = buildOrderByClause(sortBy, sortOrder)

    // Execute count and query in parallel for better performance
    const [total, reportsData] = await Promise.all([
      db.report.count({ where }),
      db.report.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy,
        select: reportListSelect,
      }),
    ])

    // Calculate pagination metadata
    const pagination = calculatePagination(total, page, limit)

    return c.json({
      data: reportsData,
      meta: pagination,
    })
  } catch (error) {
    console.error('List reports error:', error)
    return c.json({ error: 'Failed to fetch reports' }, 500)
  }
})

/**
 * GET /reports/:id
 * Get full report details (optimized with proper includes)
 */
reports.get('/:id', zValidator('param', reportIdSchema), async (c) => {
  const { id } = c.req.valid('param')

  try {
    const report = await db.report.findUnique({
      where: { id },
      include: reportDetailInclude,
    })

    if (!report) {
      return c.json({ error: 'Report not found' }, 404)
    }

    // Increment view count asynchronously (don't wait)
    db.report
      .update({
        where: { id },
        data: { viewCount: { increment: 1 } },
      })
      .catch((err) => console.error('Failed to increment view count:', err))

    return c.json({ data: report })
  } catch (error) {
    console.error('Get report error:', error)
    return c.json({ error: 'Failed to fetch report' }, 500)
  }
})

/**
 * POST /reports
 * Create a new report (authenticated or anonymous)
 */
reports.post('/', optionalAuthMiddleware, zValidator('json', createReportSchema), async (c) => {
  const user = c.get('user')
  const data = c.req.valid('json')

  try {
    // Get next sequence number for this region
    const lastReport = await db.report.findFirst({
      where: {
        regionCode: data.regionCode,
        trackingCode: {
          startsWith: `LP-${new Date().getFullYear()}-${data.regionCode}`,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        trackingCode: true,
      },
    })

    // Extract sequence from last tracking code or start at 1
    let sequence = 1
    if (lastReport) {
      const parts = lastReport.trackingCode.split('-')
      sequence = parseInt(parts[3], 10) + 1
    }

    // Generate tracking code
    const trackingCode = generateTrackingCode(data.regionCode, sequence)

    // Generate anonymous token if anonymous report
    const anonymousToken = data.isAnonymous ? crypto.randomUUID() : null

    // Create report
    const report = await db.report.create({
      data: {
        trackingCode,
        title: data.title,
        description: data.description,
        categoryId: data.categoryId,
        locationLat: data.locationLat,
        locationLng: data.locationLng,
        locationAddress: data.locationAddress,
        regionCode: data.regionCode,
        regionName: data.regionName,
        reporterId: user?.sub || null,
        anonymousToken,
        status: 'new',
        priority: 'medium', // Default, will be updated by AI
        dangerLevel: 3, // Default, will be updated by AI
        priorityScore: 50, // Default, will be updated by AI
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            emoji: true,
          },
        },
      },
    })

    // Create initial status history
    await db.statusHistory.create({
      data: {
        reportId: report.id,
        oldStatus: 'new',
        newStatus: 'new',
        note: 'Laporan dibuat',
        changedById: user?.sub || null,
      },
    })

    // Queue AI analysis job
    await addAIAnalysisJob({
      reportId: report.id,
      hasPhoto: false, // Will be updated when media is uploaded
    })

    return c.json(
      {
        data: {
          ...report,
          anonymousToken: data.isAnonymous ? anonymousToken : undefined,
        },
      },
      201
    )
  } catch (error) {
    console.error('Create report error:', error)
    return c.json({ error: 'Failed to create report' }, 500)
  }
})

/**
 * POST /reports/:id/media/upload-url
 * Request presigned URL for media upload
 */
reports.post(
  '/:id/media/upload-url',
  optionalAuthMiddleware,
  zValidator('param', reportIdSchema),
  zValidator('json', requestUploadUrlSchema),
  async (c) => {
    const { id } = c.req.valid('param')
    const { mediaType, mimeType, fileSizeBytes } = c.req.valid('json')
    const user = c.get('user')

    try {
      // Check if report exists and user has permission
      const report = await db.report.findUnique({
        where: { id },
        select: {
          id: true,
          reporterId: true,
          anonymousToken: true,
          _count: {
            select: {
              media: {
                where: {
                  mediaType: { in: ['photo', 'video'] },
                },
              },
            },
          },
        },
      })

      if (!report) {
        return c.json({ error: 'Report not found' }, 404)
      }

      // Check permission (reporter or anonymous token holder)
      const anonymousToken = c.req.header('X-Anonymous-Token')
      if (report.reporterId && report.reporterId !== user?.sub) {
        return c.json({ error: 'Unauthorized' }, 403)
      }
      if (report.anonymousToken && report.anonymousToken !== anonymousToken) {
        return c.json({ error: 'Unauthorized' }, 403)
      }

      // Check media limits (4 photos + 1 video)
      if (mediaType === 'photo' && report._count.media >= 4) {
        return c.json({ error: 'Maximum 4 photos allowed per report' }, 400)
      }
      if (mediaType === 'video' && report._count.media >= 1) {
        return c.json({ error: 'Maximum 1 video allowed per report' }, 400)
      }

      // Generate presigned URL
      const result = await generateUploadUrl({
        reportId: id,
        mediaType,
        mimeType,
        fileSizeBytes,
      })

      if (!result) {
        return c.json({ error: 'Failed to generate upload URL' }, 500)
      }

      return c.json({ data: result })
    } catch (error) {
      console.error('Generate upload URL error:', error)
      return c.json({ error: 'Failed to generate upload URL' }, 500)
    }
  }
)

/**
 * POST /reports/:id/media
 * Confirm media upload after client uploads to S3
 */
reports.post(
  '/:id/media',
  optionalAuthMiddleware,
  zValidator('param', reportIdSchema),
  zValidator('json', confirmMediaUploadSchema),
  async (c) => {
    const { id } = c.req.valid('param')
    const { fileKey, mediaType } = c.req.valid('json')
    const user = c.get('user')

    try {
      // Check if report exists and user has permission
      const report = await db.report.findUnique({
        where: { id },
        select: {
          id: true,
          reporterId: true,
          anonymousToken: true,
        },
      })

      if (!report) {
        return c.json({ error: 'Report not found' }, 404)
      }

      // Check permission
      const anonymousToken = c.req.header('X-Anonymous-Token')
      if (report.reporterId && report.reporterId !== user?.sub) {
        return c.json({ error: 'Unauthorized' }, 403)
      }
      if (report.anonymousToken && report.anonymousToken !== anonymousToken) {
        return c.json({ error: 'Unauthorized' }, 403)
      }

      // Create media record
      const media = await db.media.create({
        data: {
          reportId: id,
          fileUrl: getPublicUrl(fileKey),
          fileKey: fileKey,
          mediaType,
        },
        select: {
          id: true,
          fileUrl: true,
          mediaType: true,
          createdAt: true,
        },
      })

      return c.json({ data: media }, 201)
    } catch (error) {
      console.error('Confirm media upload error:', error)
      return c.json({ error: 'Failed to confirm media upload' }, 500)
    }
  }
)

export default reports

/**
 * POST /reports/:id/vote
 * Upvote a report (authenticated users only)
 */
reports.post('/:id/vote', authMiddleware, zValidator('param', reportIdSchema), async (c) => {
  const { id } = c.req.valid('param')
  const user = c.get('user')

  try {
    // Check if report exists
    const report = await db.report.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!report) {
      return c.json({ error: 'Report not found' }, 404)
    }

    // Check if user already voted
    const existingVote = await db.vote.findFirst({
      where: {
        userId: user.sub,
        reportId: id,
      },
    })

    if (existingVote) {
      return c.json({ error: 'Already voted' }, 400)
    }

    // Create vote
    await db.vote.create({
      data: {
        userId: user.sub,
        reportId: id,
      },
    })

    // Increment upvote count
    const updatedReport = await db.report.update({
      where: { id },
      data: {
        upvoteCount: {
          increment: 1,
        },
      },
      select: {
        upvoteCount: true,
      },
    })

    return c.json({
      data: {
        upvoteCount: updatedReport.upvoteCount,
      },
    })
  } catch (error) {
    console.error('Vote error:', error)
    return c.json({ error: 'Failed to vote' }, 500)
  }
})

/**
 * DELETE /reports/:id/vote
 * Remove upvote from a report
 */
reports.delete('/:id/vote', authMiddleware, zValidator('param', reportIdSchema), async (c) => {
  const { id } = c.req.valid('param')
  const user = c.get('user')

  try {
    // Delete vote
    const deletedVote = await db.vote.deleteMany({
      where: {
        userId: user.sub,
        reportId: id,
      },
    })

    if (deletedVote.count === 0) {
      return c.json({ error: 'Vote not found' }, 404)
    }

    // Decrement upvote count
    const updatedReport = await db.report.update({
      where: { id },
      data: {
        upvoteCount: {
          decrement: 1,
        },
      },
      select: {
        upvoteCount: true,
      },
    })

    return c.json({
      data: {
        upvoteCount: updatedReport.upvoteCount,
      },
    })
  } catch (error) {
    console.error('Remove vote error:', error)
    return c.json({ error: 'Failed to remove vote' }, 500)
  }
})

/**
 * GET /reports/:id/comments
 * Get comments for a report (public, with threading)
 */
reports.get('/:id/comments', zValidator('param', reportIdSchema), async (c) => {
  const { id } = c.req.valid('param')

  try {
    // Get all comments for this report
    const comments = await db.comment.findMany({
      where: {
        reportId: id,
        parentId: null, // Only get top-level comments
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        replies: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return c.json({ data: comments })
  } catch (error) {
    console.error('Get comments error:', error)
    return c.json({ error: 'Failed to fetch comments' }, 500)
  }
})

/**
 * POST /reports/:id/comments
 * Add a comment to a report (authenticated users only)
 */
reports.post(
  '/:id/comments',
  authMiddleware,
  zValidator('param', reportIdSchema),
  zValidator('json', createCommentSchema),
  async (c) => {
    const { id } = c.req.valid('param')
    const { content, parentId } = c.req.valid('json')
    const user = c.get('user')

    try {
      // Check if report exists
      const report = await db.report.findUnique({
        where: { id },
        select: { id: true },
      })

      if (!report) {
        return c.json({ error: 'Report not found' }, 404)
      }

      // If parentId provided, check if parent comment exists and is top-level
      if (parentId) {
        const parentComment = await db.comment.findUnique({
          where: { id: parentId },
          select: { parentId: true, reportId: true },
        })

        if (!parentComment) {
          return c.json({ error: 'Parent comment not found' }, 404)
        }

        if (parentComment.reportId !== id) {
          return c.json({ error: 'Parent comment belongs to different report' }, 400)
        }

        if (parentComment.parentId !== null) {
          return c.json({ error: 'Cannot reply to a reply (only 1 level nesting allowed)' }, 400)
        }
      }

      // Create comment
      const comment = await db.comment.create({
        data: {
          reportId: id,
          authorId: user.sub,
          content,
          parentId: parentId || null,
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
        },
      })

      // Increment comment count on report
      await db.report.update({
        where: { id },
        data: {
          commentCount: {
            increment: 1,
          },
        },
      })

      return c.json({ data: comment }, 201)
    } catch (error) {
      console.error('Create comment error:', error)
      return c.json({ error: 'Failed to create comment' }, 500)
    }
  }
)

/**
 * GET /reports/:id/status-history
 * Get status history timeline for a report (public)
 */
reports.get('/:id/status-history', zValidator('param', reportIdSchema), async (c) => {
  const { id } = c.req.valid('param')

  try {
    const history = await db.statusHistory.findMany({
      where: {
        reportId: id,
      },
      include: {
        changedBy: {
          select: {
            name: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return c.json({ data: history })
  } catch (error) {
    console.error('Get status history error:', error)
    return c.json({ error: 'Failed to fetch status history' }, 500)
  }
})

/**
 * POST /reports/:id/rating
 * Rate completed work (satisfaction rating)
 * Only allowed when status is 'completed' or 'verified_complete'
 */
reports.post(
  '/:id/rating',
  authMiddleware,
  zValidator('param', reportIdSchema),
  zValidator('json', createRatingSchema),
  async (c) => {
    const { id } = c.req.valid('param')
    const { rating, comment } = c.req.valid('json')
    const user = c.get('user')

    try {
      // Check if report exists and is completed
      const report = await db.report.findUnique({
        where: { id },
        select: {
          id: true,
          status: true,
          reporterId: true,
        },
      })

      if (!report) {
        return c.json({ error: 'Report not found' }, 404)
      }

      if (report.status !== 'completed' && report.status !== 'verified_complete') {
        return c.json({ error: 'Can only rate completed reports' }, 400)
      }

      // Check if user is the reporter
      if (report.reporterId !== user.sub) {
        return c.json({ error: 'Only the reporter can rate the work' }, 403)
      }

      // Check if already rated
      const existingRating = await db.satisfactionRating.findUnique({
        where: {
          reportId: id,
        },
      })

      if (existingRating) {
        return c.json({ error: 'Already rated this report' }, 400)
      }

      // Create rating
      const satisfactionRating = await db.satisfactionRating.create({
        data: {
          reportId: id,
          userId: user.sub,
          rating,
          review: comment || null,
        },
      })

      return c.json({ data: satisfactionRating }, 201)
    } catch (error) {
      console.error('Create rating error:', error)
      return c.json({ error: 'Failed to create rating' }, 500)
    }
  }
)

/**
 * POST /reports/:id/verify-complete
 * Citizen confirms work is actually completed
 * Only allowed within 7 days after status changed to 'completed'
 */
reports.post(
  '/:id/verify-complete',
  authMiddleware,
  zValidator('param', reportIdSchema),
  zValidator('json', verifyCompleteSchema),
  async (c) => {
    const { id } = c.req.valid('param')
    const { isComplete, note } = c.req.valid('json')
    const user = c.get('user')

    try {
      // Check if report exists and is completed
      const report = await db.report.findUnique({
        where: { id },
        select: {
          id: true,
          status: true,
          reporterId: true,
          completedAt: true,
        },
      })

      if (!report) {
        return c.json({ error: 'Report not found' }, 404)
      }

      if (report.status !== 'completed') {
        return c.json({ error: 'Report is not marked as completed' }, 400)
      }

      // Check if user is the reporter
      if (report.reporterId !== user.sub) {
        return c.json({ error: 'Only the reporter can verify completion' }, 403)
      }

      // Check if within 7-day window
      if (report.completedAt) {
        const daysSinceCompletion = Math.floor(
          (Date.now() - report.completedAt.getTime()) / (1000 * 60 * 60 * 24)
        )
        if (daysSinceCompletion > 7) {
          return c.json({ error: 'Verification window has expired (7 days)' }, 400)
        }
      }

      // Update report status
      const newStatus = isComplete ? 'verified_complete' : 'disputed'
      const updatedReport = await db.report.update({
        where: { id },
        data: {
          status: newStatus,
        },
      })

      // Create status history
      await db.statusHistory.create({
        data: {
          reportId: id,
          oldStatus: report.status,
          newStatus: newStatus,
          note: note || (isComplete ? 'Warga memverifikasi pekerjaan selesai' : 'Warga menyanggah pekerjaan belum selesai'),
          changedById: user.sub,
        },
      })

      return c.json({ data: updatedReport })
    } catch (error) {
      console.error('Verify complete error:', error)
      return c.json({ error: 'Failed to verify completion' }, 500)
    }
  }
)
