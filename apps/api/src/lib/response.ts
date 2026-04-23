// ── apps/api/src/lib/response.ts ──
// Standard response envelope helpers for consistent API responses

import type { Context } from 'hono'

export interface PaginationMeta {
  total: number
  page: number
  limit: number
  pages: number
}

/**
 * Sends a successful JSON response with the standard envelope.
 */
export function ok<T>(c: Context, data: T, status: 200 | 201 = 200) {
  return c.json({ success: true, data }, status)
}

/**
 * Sends a paginated success response.
 */
export function paginated<T>(c: Context, data: T[], meta: PaginationMeta) {
  return c.json({ success: true, data, meta })
}

/**
 * Sends an error response.
 */
export function err(
  c: Context,
  code: string,
  message: string,
  status: 400 | 401 | 403 | 404 | 409 | 422 | 429 | 500 = 400
) {
  return c.json({ success: false, error: { code, message } }, status)
}
