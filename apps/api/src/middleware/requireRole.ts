// ── apps/api/src/middleware/requireRole.ts ──
// Role-based access control middleware
// Enforces role hierarchy: citizen < officer < admin < super_admin

import { Context, Next } from 'hono'
import { JwtPayload } from '../lib/jwt.js'

/**
 * Role hierarchy levels (higher = more permissions)
 */
const ROLE_HIERARCHY: Record<string, number> = {
  citizen: 0,
  officer: 1,
  admin: 2,
  super_admin: 3,
}

/**
 * Creates a middleware that requires a minimum role level.
 * Must be used after authMiddleware.
 * 
 * @param minRole - Minimum required role
 * @returns Middleware function
 * 
 * @example
 * ```typescript
 * // Requires officer or higher (officer, admin, super_admin)
 * app.get('/gov/reports', authMiddleware, requireRole('officer'), handler)
 * 
 * // Requires admin or higher (admin, super_admin)
 * app.post('/gov/officers', authMiddleware, requireRole('admin'), handler)
 * ```
 */
export function requireRole(minRole: keyof typeof ROLE_HIERARCHY) {
  return async (c: Context, next: Next) => {
    const user = c.get('user') as JwtPayload | undefined

    if (!user) {
      return c.json({ error: 'Authentication required' }, 401)
    }

    const userRoleLevel = ROLE_HIERARCHY[user.role] ?? -1
    const requiredRoleLevel = ROLE_HIERARCHY[minRole] ?? 999

    if (userRoleLevel < requiredRoleLevel) {
      return c.json(
        {
          error: 'Insufficient permissions',
          required: minRole,
          current: user.role,
        },
        403
      )
    }

    await next()
  }
}

/**
 * Checks if a user has a specific role or higher.
 * 
 * @param userRole - User's current role
 * @param requiredRole - Required minimum role
 * @returns True if user has sufficient permissions
 */
export function hasRole(userRole: string, requiredRole: keyof typeof ROLE_HIERARCHY): boolean {
  const userLevel = ROLE_HIERARCHY[userRole] ?? -1
  const requiredLevel = ROLE_HIERARCHY[requiredRole] ?? 999
  return userLevel >= requiredLevel
}

/**
 * Gets the role hierarchy level for a role.
 * 
 * @param role - Role name
 * @returns Hierarchy level (higher = more permissions)
 */
export function getRoleLevel(role: string): number {
  return ROLE_HIERARCHY[role] ?? -1
}
