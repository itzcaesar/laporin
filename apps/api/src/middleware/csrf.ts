// ── apps/api/src/middleware/csrf.ts ──
// CSRF protection using double-submit cookie pattern
// Sets a non-HttpOnly CSRF cookie; validates X-CSRF-Token header on mutations

import { Context, Next } from 'hono'
import { getCookie, setCookie } from 'hono/cookie'
import { env } from '../env.js'

/**
 * Generate a cryptographically random CSRF token.
 */
function generateCsrfToken(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Methods that require CSRF validation (state-changing).
 */
const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

/**
 * CSRF middleware using double-submit cookie pattern.
 *
 * How it works:
 * 1. On every request, ensures a `laporin_csrf` cookie exists (non-HttpOnly, so JS can read it)
 * 2. On state-changing requests (POST/PUT/PATCH/DELETE):
 *    - If auth is via `Authorization: Bearer` header → CSRF not needed (token-based auth)
 *    - If auth is via cookie → Requires `X-CSRF-Token` header matching the cookie value
 */
export async function csrfMiddleware(c: Context, next: Next) {
  // Ensure CSRF cookie exists
  let csrfCookie = getCookie(c, 'laporin_csrf')

  if (!csrfCookie) {
    csrfCookie = generateCsrfToken()
    setCookie(c, 'laporin_csrf', csrfCookie, {
      httpOnly: false, // JS needs to read this
      secure: env.NODE_ENV === 'production',
      sameSite: 'Lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    })
  }

  // Only validate on state-changing methods
  if (!UNSAFE_METHODS.has(c.req.method)) {
    await next()
    return
  }

  // Skip CSRF validation if auth is via Authorization header (API-key / Bearer token auth)
  // CSRF attacks exploit cookie-based auth; token-in-header auth is inherently CSRF-safe
  const authHeader = c.req.header('Authorization')
  if (authHeader?.startsWith('Bearer ')) {
    await next()
    return
  }

  // Skip CSRF for auth endpoints that don't have cookies yet (login, register)
  // These endpoints receive credentials in the request body, not from cookies
  const path = new URL(c.req.url).pathname
  const csrfExemptPaths = [
    '/api/v1/auth/login',
    '/api/v1/auth/register',
    '/api/v1/auth/otp/send',
    '/api/v1/auth/otp/verify',
    '/api/v1/auth/password/forgot',
    '/api/v1/auth/password/reset',
  ]
  if (csrfExemptPaths.some((exempt) => path.endsWith(exempt))) {
    await next()
    return
  }

  // Validate CSRF token
  const csrfHeader = c.req.header('X-CSRF-Token')
  if (!csrfHeader || csrfHeader !== csrfCookie) {
    return c.json(
      {
        success: false,
        error: {
          code: 'CSRF_VALIDATION_FAILED',
          message: 'Invalid or missing CSRF token',
        },
      },
      403
    )
  }

  await next()
}
