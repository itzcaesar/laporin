// ── apps/api/src/middleware/auth.ts ──
// JWT authentication middleware
// Verifies JWT token and attaches user info to context

import { Context, Next } from 'hono'
import { verifyToken, JwtPayload } from '../lib/jwt.js'

/**
 * Hono context variables for authenticated requests
 */
export interface AuthVariables {
  user: JwtPayload
}

/**
 * Authentication middleware.
 * Verifies JWT token from Authorization header and attaches user to context.
 * 
 * Usage:
 * ```typescript
 * app.get('/protected', authMiddleware, (c) => {
 *   const user = c.get('user')
 *   return c.json({ userId: user.sub })
 * })
 * ```
 */
export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Missing or invalid Authorization header' }, 401)
  }

  const token = authHeader.substring(7) // Remove 'Bearer ' prefix

  try {
    const payload = await verifyToken(token)
    c.set('user', payload)
    await next()
  } catch (error) {
    return c.json({ error: 'Invalid or expired token' }, 401)
  }
}

/**
 * Optional authentication middleware.
 * Attaches user to context if token is present and valid, but doesn't fail if missing.
 * Useful for endpoints that work for both authenticated and anonymous users.
 */
export async function optionalAuthMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization')

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7)

    try {
      const payload = await verifyToken(token)
      c.set('user', payload)
    } catch {
      // Silently ignore invalid tokens for optional auth
    }
  }

  await next()
}
