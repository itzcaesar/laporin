// ── apps/api/src/routes/gov/officers.ts ──
// Officer management endpoints (admin only)

import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { db } from '../../db.js'
import { authMiddleware, type AuthVariables } from '../../middleware/auth.js'
import { requireRole } from '../../middleware/requireRole.js'
import { hashPassword } from '../../lib/password.js'
import {
  createOfficerSchema,
  updateOfficerSchema,
} from '../../validators/gov.validator.js'
import { z } from 'zod'

const govOfficers = new Hono<{ Variables: AuthVariables }>()

// All routes require admin role
govOfficers.use('*', authMiddleware, requireRole('admin'))

/**
 * GET /gov/officers
 * List all officers in agency
 */
govOfficers.get('/', async (c) => {
  const user = c.get('user')
  const { page = '1', limit = '20', agencyId, role, isActive } = c.req.query()

  try {
    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)

    // Build where clause
    const where: any = {
      role: { in: ['officer', 'admin'] },
    }

    // Filter by agency if not super_admin
    if (user.role !== 'super_admin' && user.agencyId) {
      where.agencyId = user.agencyId
    }

    if (agencyId) where.agencyId = agencyId
    if (role) where.role = role
    if (isActive !== undefined) where.isActive = isActive === 'true'

    // Get total count
    const total = await db.user.count({ where })

    // Get paginated officers
    const officers = await db.user.findMany({
      where,
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        nip: true,
        role: true,
        agencyId: true,
        phone: true,
        isActive: true,
        createdAt: true,
        lastLoginAt: true,
        agency: {
          select: {
            id: true,
            name: true,
            shortName: true,
          },
        },
        _count: {
          select: {
            assignedReports: true,
          },
        },
      },
    })

    const pages = Math.ceil(total / limitNum)

    return c.json({
      data: officers,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        pages,
      },
    })
  } catch (error) {
    console.error('List officers error:', error)
    return c.json({ error: 'Failed to fetch officers' }, 500)
  }
})

/**
 * GET /gov/officers/:id
 * Get officer details
 */
govOfficers.get('/:id', async (c) => {
  const id = c.req.param('id')
  const user = c.get('user')

  try {
    const officer = await db.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        nip: true,
        role: true,
        agencyId: true,
        phone: true,
        isActive: true,
        createdAt: true,
        lastLoginAt: true,
        agency: {
          select: {
            id: true,
            name: true,
            shortName: true,
            regionCode: true,
          },
        },
        assignedReports: {
          where: {
            status: { in: ['verified', 'in_progress'] },
          },
          take: 10,
          orderBy: { priorityScore: 'desc' },
          select: {
            id: true,
            trackingCode: true,
            title: true,
            status: true,
            priority: true,
            createdAt: true,
            category: {
              select: {
                name: true,
                emoji: true,
              },
            },
          },
        },
        _count: {
          select: {
            assignedReports: true,
          },
        },
      },
    })

    if (!officer) {
      return c.json({ error: 'Officer not found' }, 404)
    }

    // Check access
    if (
      user.role !== 'super_admin' &&
      user.agencyId &&
      officer.agencyId !== user.agencyId
    ) {
      return c.json({ error: 'Access denied' }, 403)
    }

    return c.json({ data: officer })
  } catch (error) {
    console.error('Get officer error:', error)
    return c.json({ error: 'Failed to fetch officer' }, 500)
  }
})

/**
 * POST /gov/officers
 * Create new officer account
 */
govOfficers.post('/', zValidator('json', createOfficerSchema), async (c) => {
  const { email, password, name, nip, agencyId, role, phone } = c.req.valid('json')
  const user = c.get('user')

  try {
    // Check if email already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return c.json({ error: 'Email already registered' }, 400)
    }

    // Check if NIP already exists
    const existingNip = await db.user.findFirst({
      where: { nip },
    })

    if (existingNip) {
      return c.json({ error: 'NIP already registered' }, 400)
    }

    // Verify agency exists
    const agency = await db.agency.findUnique({
      where: { id: agencyId },
    })

    if (!agency) {
      return c.json({ error: 'Agency not found' }, 404)
    }

    // Check access - can only create officers in own agency (unless super_admin)
    if (user.role !== 'super_admin' && user.agencyId !== agencyId) {
      return c.json({ error: 'Can only create officers in your own agency' }, 403)
    }

    // Hash password
    const passwordHash = await hashPassword(password)

    // Create officer
    const officer = await db.user.create({
      data: {
        email,
        passwordHash,
        name,
        nip,
        agencyId,
        role,
        phone,
        isVerified: true, // Officers are pre-verified
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        nip: true,
        role: true,
        agencyId: true,
        phone: true,
        isActive: true,
        createdAt: true,
      },
    })

    // Create audit log
    await db.auditLog.create({
      data: {
        actorId: user.sub,
        action: 'create_officer',
        targetType: 'user',
        targetId: officer.id,
        metadata: { email, name, nip, agencyId, role },
      },
    })

    return c.json({ data: officer }, 201)
  } catch (error) {
    console.error('Create officer error:', error)
    return c.json({ error: 'Failed to create officer' }, 500)
  }
})

/**
 * PATCH /gov/officers/:id
 * Update officer account
 */
govOfficers.patch('/:id', zValidator('json', updateOfficerSchema), async (c) => {
  const id = c.req.param('id')
  const updates = c.req.valid('json')
  const user = c.get('user')

  try {
    // Get existing officer
    const officer = await db.user.findUnique({
      where: { id },
      select: { id: true, agencyId: true, role: true },
    })

    if (!officer) {
      return c.json({ error: 'Officer not found' }, 404)
    }

    // Check access
    if (user.role !== 'super_admin' && user.agencyId !== officer.agencyId) {
      return c.json({ error: 'Can only update officers in your own agency' }, 403)
    }

    // If changing agency, verify new agency exists
    if (updates.agencyId) {
      const agency = await db.agency.findUnique({
        where: { id: updates.agencyId },
      })

      if (!agency) {
        return c.json({ error: 'Agency not found' }, 404)
      }

      // Check access for new agency
      if (user.role !== 'super_admin' && user.agencyId !== updates.agencyId) {
        return c.json({ error: 'Can only assign to your own agency' }, 403)
      }
    }

    // Update officer
    const updatedOfficer = await db.user.update({
      where: { id },
      data: updates,
      select: {
        id: true,
        email: true,
        name: true,
        nip: true,
        role: true,
        agencyId: true,
        phone: true,
        isActive: true,
        updatedAt: true,
      },
    })

    // Create audit log
    await db.auditLog.create({
      data: {
        actorId: user.sub,
        action: 'update_officer',
        targetType: 'user',
        targetId: id,
        metadata: updates,
      },
    })

    return c.json({ data: updatedOfficer })
  } catch (error) {
    console.error('Update officer error:', error)
    return c.json({ error: 'Failed to update officer' }, 500)
  }
})

/**
 * DELETE /gov/officers/:id
 * Deactivate officer account (soft delete)
 */
govOfficers.delete('/:id', async (c) => {
  const id = c.req.param('id')
  const user = c.get('user')

  try {
    // Get officer
    const officer = await db.user.findUnique({
      where: { id },
      select: { id: true, agencyId: true, isActive: true },
    })

    if (!officer) {
      return c.json({ error: 'Officer not found' }, 404)
    }

    // Check access
    if (user.role !== 'super_admin' && user.agencyId !== officer.agencyId) {
      return c.json({ error: 'Can only deactivate officers in your own agency' }, 403)
    }

    // Cannot deactivate self
    if (id === user.sub) {
      return c.json({ error: 'Cannot deactivate your own account' }, 400)
    }

    // Deactivate (soft delete)
    await db.user.update({
      where: { id },
      data: { isActive: false },
    })

    // Create audit log
    await db.auditLog.create({
      data: {
        actorId: user.sub,
        action: 'deactivate_officer',
        targetType: 'user',
        targetId: id,
        metadata: {},
      },
    })

    return c.json({ data: { success: true } })
  } catch (error) {
    console.error('Deactivate officer error:', error)
    return c.json({ error: 'Failed to deactivate officer' }, 500)
  }
})

/**
 * GET /gov/officers/:id/stats
 * Get officer performance statistics
 */
govOfficers.get('/:id/stats', async (c) => {
  const id = c.req.param('id')
  const user = c.get('user')
  const { period = '30d' } = c.req.query()

  try {
    // Get officer
    const officer = await db.user.findUnique({
      where: { id },
      select: { id: true, agencyId: true },
    })

    if (!officer) {
      return c.json({ error: 'Officer not found' }, 404)
    }

    // Check access
    if (user.role !== 'super_admin' && user.agencyId !== officer.agencyId) {
      return c.json({ error: 'Access denied' }, 403)
    }

    // Calculate date range
    const daysMap: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90, '365d': 365 }
    const days = daysMap[period] || 30
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    // Get stats
    const totalAssigned = await db.report.count({
      where: {
        assignedOfficerId: id,
        createdAt: { gte: startDate },
      },
    })

    const completed = await db.report.count({
      where: {
        assignedOfficerId: id,
        status: { in: ['completed', 'verified_complete', 'closed'] },
        createdAt: { gte: startDate },
      },
    })

    const inProgress = await db.report.count({
      where: {
        assignedOfficerId: id,
        status: 'in_progress',
      },
    })

    // Get average resolution time
    const resolvedReports = await db.report.findMany({
      where: {
        assignedOfficerId: id,
        completedAt: { not: null },
        createdAt: { gte: startDate },
      },
      select: {
        createdAt: true,
        completedAt: true,
      },
    })

    const avgResolutionDays =
      resolvedReports.length > 0
        ? resolvedReports.reduce((sum: number, report: any) => {
            const days = Math.floor(
              (report.completedAt!.getTime() - report.createdAt.getTime()) /
                (1000 * 60 * 60 * 24)
            )
            return sum + days
          }, 0) / resolvedReports.length
        : 0

    return c.json({
      data: {
        period,
        totalAssigned,
        completed,
        inProgress,
        completionRate: totalAssigned > 0 ? (completed / totalAssigned) * 100 : 0,
        avgResolutionDays: Math.round(avgResolutionDays * 10) / 10,
      },
    })
  } catch (error) {
    console.error('Officer stats error:', error)
    return c.json({ error: 'Failed to fetch officer stats' }, 500)
  }
})

/**
 * POST /gov/officers/:id/reset-password
 * Reset officer password — generates a temporary password and returns it to the admin.
 * Admin is responsible for communicating the temp password to the officer securely.
 */
govOfficers.post('/:id/reset-password', async (c) => {
  const id = c.req.param('id')
  const user = c.get('user')

  try {
    // Get officer
    const officer = await db.user.findUnique({
      where: { id },
      select: { id: true, agencyId: true, name: true, email: true, isActive: true },
    })

    if (!officer) {
      return c.json({ error: 'Officer not found' }, 404)
    }

    // Check access
    if (user.role !== 'super_admin' && user.agencyId !== officer.agencyId) {
      return c.json({ error: 'Can only reset passwords for officers in your own agency' }, 403)
    }

    if (!officer.isActive) {
      return c.json({ error: 'Cannot reset password for an inactive officer' }, 400)
    }

    // Generate a random 12-character temporary password
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
    const tempPassword = Array.from({ length: 12 }, () =>
      chars[Math.floor(Math.random() * chars.length)]
    ).join('')

    // Hash and store
    const passwordHash = await hashPassword(tempPassword)
    await db.user.update({
      where: { id },
      data: { passwordHash },
    })

    // Revoke all active refresh tokens so existing sessions are invalidated
    await db.refreshToken.updateMany({
      where: { userId: id, isRevoked: false },
      data: { isRevoked: true },
    })

    // Audit log
    await db.auditLog.create({
      data: {
        actorId: user.sub,
        action: 'reset_officer_password',
        targetType: 'user',
        targetId: id,
        metadata: { officerEmail: officer.email },
      },
    })

    return c.json({
      data: {
        tempPassword,
        message: `Password petugas ${officer.name ?? officer.email} berhasil direset. Sampaikan kata sandi sementara ini kepada petugas dan minta mereka segera mengubahnya.`,
      },
    })
  } catch (error) {
    console.error('Reset officer password error:', error)
    return c.json({ error: 'Failed to reset officer password' }, 500)
  }
})

export default govOfficers
