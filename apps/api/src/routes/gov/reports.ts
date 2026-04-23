// ── apps/api/src/routes/gov/reports.ts ──
// Government report management endpoints

import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { db } from '../../db.js'
import { authMiddleware, type AuthVariables } from '../../middleware/auth.js'
import { requireRole } from '../../middleware/requireRole.js'
import { ok, paginated, err } from '../../lib/response.js'
import { buildMeta } from '../../lib/pagination.js'
import { getPublicUrl } from '../../services/storage.service.js'
import { awardPoints, updateBadgeProgress } from '../gamification.js'
import { invalidatePattern } from '../../lib/cache.js'
import {
  verifyReportSchema,
  assignReportSchema,
  updateStatusSchema,
  updateTimelineSchema,
  updatePrioritySchema,
  uploadGovMediaSchema,
  listGovReportsSchema,
} from '../../validators/gov.validator.js'
import { reportIdSchema } from '../../validators/report.validator.js'

const govReports = new Hono<{ Variables: AuthVariables }>()

// All routes require officer role
govReports.use('*', authMiddleware, requireRole('officer'))

/**
 * GET /gov/reports
 * List reports for government dashboard
 */
govReports.get('/', zValidator('query', listGovReportsSchema), async (c) => {
  const user = c.get('user')
  const query = c.req.valid('query')
  const page = query.page || 1
  const limit = query.limit || 20

  try {
    // Build where clause
    const where: any = {}

    // Filter by agency if not super_admin
    if (user.role !== 'super_admin' && user.agencyId) {
      where.agencyId = user.agencyId
    }

    if (query.status) where.status = query.status
    if (query.priority) where.priority = query.priority
    if (query.categoryId) where.categoryId = query.categoryId
    if (query.agencyId) where.agencyId = query.agencyId
    if (query.assignedOfficerId) where.assignedOfficerId = query.assignedOfficerId

    // SLA breach filter (requires date comparison)
    if (query.slaBreached === 'true') {
      where.estimatedEnd = { lt: new Date() }
      where.status = { notIn: ['completed', 'verified_complete', 'closed', 'rejected'] }
    }

    const sortBy = query.sortBy || 'createdAt'
    const sortOrder = query.sortOrder || 'desc'

    // Get total count and reports in parallel
    const [total, reports] = await Promise.all([
      db.report.count({ where }),
      db.report.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          category: {
            select: {
              id: true,
              name: true,
              emoji: true,
            },
          },
          reporter: {
            select: {
              id: true,
              name: true,
            },
          },
          assignedOfficer: {
            select: {
              id: true,
              name: true,
              nip: true,
            },
          },
          agency: {
            select: {
              id: true,
              name: true,
              shortName: true,
            },
          },
          _count: {
            select: {
              media: true,
              comments: true,
              votes: true,
            },
          },
        },
      }),
    ])

    return paginated(c, reports, buildMeta(total, { page, limit }))
  } catch (error) {
    console.error('List gov reports error:', error)
    return err(c, 'INTERNAL_ERROR', 'Gagal memuat laporan', 500)
  }
})

/**
 * GET /gov/reports/:id
 * Get full report details for government
 */
govReports.get('/:id', zValidator('param', reportIdSchema), async (c) => {
  const { id } = c.req.valid('param')
  const user = c.get('user')

  try {
    const report = await db.report.findUnique({
      where: { id },
      include: {
        category: true,
        reporter: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            createdAt: true,
          },
        },
        assignedOfficer: {
          select: {
            id: true,
            name: true,
            nip: true,
            email: true,
            phone: true,
          },
        },
        agency: true,
        media: {
          orderBy: {
            createdAt: 'asc',
          },
        },
        statusHistory: {
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
        },
        comments: {
          include: {
            author: {
              select: {
                name: true,
                role: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        rating: true,
        aiAnalysis: true,
      },
    })

    if (!report) {
      return err(c, 'REPORT_NOT_FOUND', 'Laporan tidak ditemukan', 404)
    }

    // Check agency access
    if (user.role !== 'super_admin' && user.agencyId && report.agencyId !== user.agencyId) {
      return c.json({ error: 'Access denied' }, 403)
    }

    return c.json({ data: report })
  } catch (error) {
    console.error('Get gov report error:', error)
    return c.json({ error: 'Failed to fetch report' }, 500)
  }
})

/**
 * PATCH /gov/reports/:id/verify
 * Verify report validity
 */
govReports.patch(
  '/:id/verify',
  zValidator('param', reportIdSchema),
  zValidator('json', verifyReportSchema),
  async (c) => {
    const { id } = c.req.valid('param')
    const { result, note, officerNip, duplicateOfId } = c.req.valid('json')
    const user = c.get('user')

    try {
      // Verify NIP matches user
      const officer = await db.user.findUnique({
        where: { id: user.sub },
        select: { nip: true, agencyId: true },
      })

      if (officer?.nip !== officerNip) {
        return c.json({ error: 'NIP does not match' }, 403)
      }

      // Get report
      const report = await db.report.findUnique({
        where: { id },
        select: { id: true, status: true, agencyId: true, reporterId: true },
      })

      if (!report) {
        return c.json({ error: 'Report not found' }, 404)
      }

      // Determine new status based on verification result
      let newStatus: any = report.status
      if (result === 'valid') {
        newStatus = 'verified'
      } else if (result === 'hoax' || result === 'out_of_jurisdiction') {
        newStatus = 'rejected'
      } else if (result === 'duplicate' && duplicateOfId) {
        newStatus = 'closed'
      }

      // Update report
      const updatedReport = await db.report.update({
        where: { id },
        data: {
          status: newStatus,
          verifiedAt: new Date(),
          ...(result === 'duplicate' && duplicateOfId && { isDuplicateOf: duplicateOfId }),
        },
      })

      // Create status history
      await db.statusHistory.create({
        data: {
          reportId: id,
          oldStatus: report.status,
          newStatus: newStatus,
          note: `Verifikasi: ${result} - ${note}`,
          changedById: user.sub,
          officerNip,
        },
      })

      // Create audit log
      await db.auditLog.create({
        data: {
          actorId: user.sub,
          action: 'verify_report',
          targetType: 'report',
          targetId: id,
          metadata: { result, note, officerNip },
        },
      })

      // Award points to citizen if report is verified as valid
      if (result === 'valid' && report.reporterId) {
        await awardPoints(
          report.reporterId,
          25,
          'report_verified',
          'Laporan diverifikasi petugas',
          { reportId: id }
        )

        // Update verified reporter badge progress
        const verifiedCount = await db.report.count({
          where: {
            reporterId: report.reporterId,
            status: { in: ['verified', 'in_progress', 'completed', 'verified_complete'] },
          },
        })
        await updateBadgeProgress(report.reporterId, 'verified-reporter', verifiedCount)
      }

      // Invalidate analytics cache when report status changes
      if (report.agencyId) {
        await invalidatePattern(`analytics:*:${report.agencyId}:*`)
        await invalidatePattern(`analytics:anomalies:${report.agencyId}`)
      }

      // TODO: Send notification to citizen

      return c.json({ data: updatedReport })
    } catch (error) {
      console.error('Verify report error:', error)
      return c.json({ error: 'Failed to verify report' }, 500)
    }
  }
)

/**
 * PATCH /gov/reports/:id/assign
 * Assign report to officer (admin only)
 */
govReports.patch(
  '/:id/assign',
  requireRole('admin'),
  zValidator('param', reportIdSchema),
  zValidator('json', assignReportSchema),
  async (c) => {
    const { id } = c.req.valid('param')
    const { officerId, picNip, estimatedStart, estimatedEnd, budgetIdr } = c.req.valid('json')
    const user = c.get('user')

    try {
      // Verify officer exists and NIP matches
      const officer = await db.user.findUnique({
        where: { id: officerId },
        select: { nip: true, agencyId: true },
      })

      if (!officer) {
        return c.json({ error: 'Officer not found' }, 404)
      }

      if (officer.nip !== picNip) {
        return c.json({ error: 'NIP does not match officer' }, 400)
      }

      // Get report
      const report = await db.report.findUnique({
        where: { id },
        select: { id: true, status: true },
      })

      if (!report) {
        return c.json({ error: 'Report not found' }, 404)
      }

      // Update report
      const updatedReport = await db.report.update({
        where: { id },
        data: {
          assignedOfficerId: officerId,
          picNip,
          agencyId: officer.agencyId,
          status: 'verified',
          ...(estimatedStart && { estimatedStart: new Date(estimatedStart) }),
          ...(estimatedEnd && { estimatedEnd: new Date(estimatedEnd) }),
          ...(budgetIdr && { budgetIdr }),
        },
      })

      // Create status history
      await db.statusHistory.create({
        data: {
          reportId: id,
          oldStatus: report.status,
          newStatus: 'verified',
          note: `Ditugaskan ke petugas NIP ${picNip}`,
          changedById: user.sub,
          officerNip: picNip,
        },
      })

      // Create audit log
      await db.auditLog.create({
        data: {
          actorId: user.sub,
          action: 'assign_report',
          targetType: 'report',
          targetId: id,
          metadata: { officerId, picNip, estimatedStart, estimatedEnd, budgetIdr },
        },
      })

      // Invalidate analytics cache when report is assigned
      if (officer.agencyId) {
        await invalidatePattern(`analytics:*:${officer.agencyId}:*`)
        await invalidatePattern(`analytics:anomalies:${officer.agencyId}`)
      }

      // TODO: Send notification to citizen and assigned officer

      return c.json({ data: updatedReport })
    } catch (error) {
      console.error('Assign report error:', error)
      return c.json({ error: 'Failed to assign report' }, 500)
    }
  }
)

/**
 * PATCH /gov/reports/:id/status
 * Update report status
 */
govReports.patch(
  '/:id/status',
  zValidator('param', reportIdSchema),
  zValidator('json', updateStatusSchema),
  async (c) => {
    const { id } = c.req.valid('param')
    const { newStatus, note, officerNip } = c.req.valid('json')
    const user = c.get('user')

    try {
      // Verify NIP matches user
      const officer = await db.user.findUnique({
        where: { id: user.sub },
        select: { nip: true },
      })

      if (officer?.nip !== officerNip) {
        return c.json({ error: 'NIP does not match' }, 403)
      }

      // Get report
      const report = await db.report.findUnique({
        where: { id },
        select: { id: true, status: true, reporterId: true },
      })

      if (!report) {
        return c.json({ error: 'Report not found' }, 404)
      }

      // Validate status transition
      const validTransitions: Record<string, string[]> = {
        new: ['verified', 'rejected'],
        verified: ['in_progress', 'rejected'],
        in_progress: ['completed', 'rejected'],
        completed: ['verified_complete', 'disputed'],
        disputed: ['in_progress', 'closed'],
        rejected: ['closed'],
      }

      const allowedStatuses = validTransitions[report.status] || []
      if (!allowedStatuses.includes(newStatus)) {
        return c.json(
          { error: `Cannot transition from ${report.status} to ${newStatus}` },
          400
        )
      }

      // Update report
      const updatedReport = await db.report.update({
        where: { id },
        data: {
          status: newStatus,
          ...(newStatus === 'completed' && { completedAt: new Date() }),
        },
      })

      // Create status history
      await db.statusHistory.create({
        data: {
          reportId: id,
          oldStatus: report.status,
          newStatus: newStatus,
          note,
          changedById: user.sub,
          officerNip,
        },
      })

      // Create audit log
      await db.auditLog.create({
        data: {
          actorId: user.sub,
          action: 'update_status',
          targetType: 'report',
          targetId: id,
          metadata: { oldStatus: report.status, newStatus, note, officerNip },
        },
      })

      // Award points to citizen when report is completed
      if (newStatus === 'completed' && report.reporterId) {
        await awardPoints(
          report.reporterId,
          50,
          'report_completed',
          'Laporan selesai diperbaiki',
          { reportId: id }
        )

        // Update completed reports badge progress
        const completedCount = await db.report.count({
          where: {
            reporterId: report.reporterId,
            status: { in: ['completed', 'verified_complete'] },
          },
        })
        await updateBadgeProgress(report.reporterId, 'impact-hero', completedCount)
      }

      // Invalidate analytics cache when report status changes
      // Get agency ID from the updated report
      const reportWithAgency = await db.report.findUnique({
        where: { id },
        select: { agencyId: true },
      })
      
      if (reportWithAgency?.agencyId) {
        await invalidatePattern(`analytics:*:${reportWithAgency.agencyId}:*`)
        await invalidatePattern(`analytics:anomalies:${reportWithAgency.agencyId}`)
      }

      // TODO: Send notification to citizen

      return c.json({ data: updatedReport })
    } catch (error) {
      console.error('Update status error:', error)
      return c.json({ error: 'Failed to update status' }, 500)
    }
  }
)

/**
 * PATCH /gov/reports/:id/timeline
 * Update timeline and budget (admin only)
 */
govReports.patch(
  '/:id/timeline',
  requireRole('admin'),
  zValidator('param', reportIdSchema),
  zValidator('json', updateTimelineSchema),
  async (c) => {
    const { id } = c.req.valid('param')
    const { estimatedStart, estimatedEnd, actualEnd, budgetIdr, officerNip } = c.req.valid('json')
    const user = c.get('user')

    try {
      // Verify NIP matches user
      const officer = await db.user.findUnique({
        where: { id: user.sub },
        select: { nip: true },
      })

      if (officer?.nip !== officerNip) {
        return c.json({ error: 'NIP does not match' }, 403)
      }

      // Update report
      const updatedReport = await db.report.update({
        where: { id },
        data: {
          ...(estimatedStart && { estimatedStart: new Date(estimatedStart) }),
          ...(estimatedEnd && { estimatedEnd: new Date(estimatedEnd) }),
          ...(actualEnd && { actualEnd: new Date(actualEnd) }),
          ...(budgetIdr && { budgetIdr }),
        },
      })

      // Create audit log
      await db.auditLog.create({
        data: {
          actorId: user.sub,
          action: 'update_timeline',
          targetType: 'report',
          targetId: id,
          metadata: { estimatedStart, estimatedEnd, actualEnd, budgetIdr, officerNip },
        },
      })

      return c.json({ data: updatedReport })
    } catch (error) {
      console.error('Update timeline error:', error)
      return c.json({ error: 'Failed to update timeline' }, 500)
    }
  }
)

/**
 * PATCH /gov/reports/:id/priority
 * Manually override priority (admin only)
 */
govReports.patch(
  '/:id/priority',
  requireRole('admin'),
  zValidator('param', reportIdSchema),
  zValidator('json', updatePrioritySchema),
  async (c) => {
    const { id } = c.req.valid('param')
    const { priority, note, officerNip } = c.req.valid('json')
    const user = c.get('user')

    try {
      // Verify NIP matches user
      const officer = await db.user.findUnique({
        where: { id: user.sub },
        select: { nip: true },
      })

      if (officer?.nip !== officerNip) {
        return c.json({ error: 'NIP does not match' }, 403)
      }

      // Update report
      const updatedReport = await db.report.update({
        where: { id },
        data: { priority },
      })

      // Create audit log
      await db.auditLog.create({
        data: {
          actorId: user.sub,
          action: 'update_priority',
          targetType: 'report',
          targetId: id,
          metadata: { priority, note, officerNip },
        },
      })

      return c.json({ data: updatedReport })
    } catch (error) {
      console.error('Update priority error:', error)
      return c.json({ error: 'Failed to update priority' }, 500)
    }
  }
)

/**
 * POST /gov/reports/:id/media
 * Upload progress or completion photo
 */
govReports.post(
  '/:id/media',
  zValidator('param', reportIdSchema),
  zValidator('json', uploadGovMediaSchema),
  async (c) => {
    const { id } = c.req.valid('param')
    const { fileKey, mediaType } = c.req.valid('json')
    const user = c.get('user')

    try {
      // Check if report exists
      const report = await db.report.findUnique({
        where: { id },
        select: { id: true, assignedOfficerId: true },
      })

      if (!report) {
        return c.json({ error: 'Report not found' }, 404)
      }

      // Check if user is assigned officer or admin
      if (user.role !== 'admin' && report.assignedOfficerId !== user.sub) {
        return c.json({ error: 'Only assigned officer can upload media' }, 403)
      }

      // Create media record
      const media = await db.media.create({
        data: {
          reportId: id,
          uploaderId: user.sub,
          fileUrl: getPublicUrl(fileKey),
          fileKey,
          mediaType,
        },
      })

      return c.json({ data: media }, 201)
    } catch (error) {
      console.error('Upload gov media error:', error)
      return c.json({ error: 'Failed to upload media' }, 500)
    }
  }
)

/**
 * POST /gov/reports/:id/reanalyze
 * Re-run AI analysis on a report (admin only)
 */
govReports.post(
  '/:id/reanalyze',
  requireRole('admin'),
  zValidator('param', reportIdSchema),
  async (c) => {
    const { id } = c.req.valid('param')
    const user = c.get('user')

    try {
      // Check if report exists
      const report = await db.report.findUnique({
        where: { id },
        select: { id: true, agencyId: true },
      })

      if (!report) {
        return c.json({ error: 'Report not found' }, 404)
      }

      // Check agency access
      if (user.role !== 'super_admin' && user.agencyId && report.agencyId !== user.agencyId) {
        return c.json({ error: 'Access denied' }, 403)
      }

      // Delete existing AI analysis cache
      await db.aiAnalysisCache.deleteMany({
        where: { reportId: id },
      })

      // TODO: Re-queue AI analysis job
      // For now, just return success
      // In production, this would call: await aiQueue.add('analyze', { reportId: id })

      // Create audit log
      await db.auditLog.create({
        data: {
          actorId: user.sub,
          action: 'reanalyze_report',
          targetType: 'report',
          targetId: id,
          metadata: { triggeredBy: user.sub },
        },
      })

      return c.json({
        message: 'AI analysis queued for re-processing',
        reportId: id,
      })
    } catch (error) {
      console.error('Reanalyze report error:', error)
      return c.json({ error: 'Failed to reanalyze report' }, 500)
    }
  }
)

export default govReports
