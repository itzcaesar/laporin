// ── apps/api/src/middleware/auth.ts ──
// JWT authentication middleware
// Verifies JWT token from Authorization header OR HttpOnly cookie
// and attaches user info to context

import { Context, Next } from 'hono'
import { getCookie } from 'hono/cookie'
import { verifyToken, JwtPayload } from '../lib/jwt.js'

/**
 * Hono context variables for authenticated requests
 */
export interface AuthVariables {
  user: JwtPayload
}

/**
 * Extract JWT token from request.
 * Priority: Authorization header > laporin_token cookie
 */
function extractToken(c: Context): string | undefined {
  // 1. Try Authorization: Bearer header
  const authHeader = c.req.header('Authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }

  // 2. Fall back to HttpOnly cookie
  const tokenCookie = getCookie(c, 'laporin_token')
  if (tokenCookie) {
    return tokenCookie
  }

  return undefined
}

/**
 * Authentication middleware.
 * Verifies JWT token from Authorization header or HttpOnly cookie
 * and attaches user to context.
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
  const token = extractToken(c)

  if (!token) {
    return c.json({ error: 'Missing or invalid authentication' }, 401)
  }

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
  const token = extractToken(c)

  if (token) {
    try {
      const payload = await verifyToken(token)
      c.set('user', payload)
    } catch {
      // Silently ignore invalid tokens for optional auth
    }
  }

  await next()
}
