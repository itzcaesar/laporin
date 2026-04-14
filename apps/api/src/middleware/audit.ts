// ── apps/api/src/middleware/audit.ts ──
// Audit logging middleware for government actions
// Automatically logs all government route actions to audit_logs table

import { Context, Next } from 'hono'
import { db } from '../db.js'
import { JwtPayload } from '../lib/jwt.js'

/**
 * Audit log configuration
 */
export interface AuditConfig {
  /** Action name (e.g., "report.verify", "report.assign") */
  action: string
  /** Target type (e.g., "report", "user", "officer") */
  targetType: string
  /** Function to extract target ID from context */
  getTargetId: (c: Context) => string
  /** Optional function to extract additional metadata */
  getMetadata?: (c: Context) => Record<string, any>
}

/**
 * Creates an audit logging middleware for government actions.
 * Logs action to audit_logs table after successful request.
 * 
 * @param config - Audit configuration
 * @returns Middleware function
 * 
 * @example
 * ```typescript
 * app.patch('/gov/reports/:id/verify',
 *   authMiddleware,
 *   requireRole('officer'),
 *   auditMiddleware({
 *     action: 'report.verify',
 *     targetType: 'report',
 *     getTargetId: (c) => c.req.param('id'),
 *     getMetadata: (c) => ({ result: c.req.json().result }),
 *   }),
 *   handler
 * )
 * ```
 */
export function auditMiddleware(config: AuditConfig) {
  return async (c: Context, next: Next) => {
    // Execute the route handler first
    await next()

    // Only log if request was successful (2xx status)
    const status = c.res.status
    if (status < 200 || status >= 300) {
      return
    }

    // Get user from context (set by authMiddleware)
    const user = c.get('user') as JwtPayload | undefined

    // Extract request metadata
    const targetId = config.getTargetId(c)
    const metadata = config.getMetadata ? config.getMetadata(c) : null
    const ipAddress = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || null
    const userAgent = c.req.header('user-agent') || null

    // Log to audit_logs table (fire and forget - don't block response)
    db.auditLog
      .create({
        data: {
          actorId: user?.sub || null,
          action: config.action,
          targetType: config.targetType,
          targetId,
          metadata: metadata as any,
          ipAddress,
          userAgent,
        },
      })
      .catch((error: Error) => {
        console.error('Failed to write audit log:', error)
      })
  }
}

/**
 * Manually creates an audit log entry.
 * Useful for logging actions outside of HTTP requests.
 * 
 * @param params - Audit log parameters
 */
export async function createAuditLog(params: {
  actorId?: string
  action: string
  targetType: string
  targetId: string
  metadata?: Record<string, any>
  ipAddress?: string
  userAgent?: string
}): Promise<void> {
  await db.auditLog.create({
    data: {
      actorId: params.actorId || null,
      action: params.action,
      targetType: params.targetType,
      targetId: params.targetId,
      metadata: params.metadata as any,
      ipAddress: params.ipAddress || null,
      userAgent: params.userAgent || null,
    },
  })
}

/**
 * Queries audit logs for a specific target.
 * 
 * @param targetType - Target type (e.g., "report")
 * @param targetId - Target ID
 * @param limit - Maximum number of logs to return
 * @returns Array of audit log entries
 */
export async function getAuditLogs(
  targetType: string,
  targetId: string,
  limit: number = 50
) {
  return db.auditLog.findMany({
    where: {
      targetType,
      targetId,
    },
    include: {
      actor: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          nip: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: limit,
  })
}
