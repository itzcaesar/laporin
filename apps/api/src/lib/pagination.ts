// ── apps/api/src/lib/pagination.ts ──
// Pagination helper utilities for consistent pagination across endpoints

export interface PaginationParams {
  page: number
  limit: number
}

/**
 * Extracts and validates pagination query params.
 * Returns safe defaults if params are missing or invalid.
 */
export function getPagination(query: Record<string, string | undefined>): PaginationParams {
  const page = Math.max(1, parseInt(query.page ?? '1', 10) || 1)
  const limit = Math.min(50, Math.max(1, parseInt(query.limit ?? '20', 10) || 20))
  return { page, limit }
}

/**
 * Calculates skip (offset) for Prisma queries.
 */
export function getSkip({ page, limit }: PaginationParams): number {
  return (page - 1) * limit
}

/**
 * Builds the meta object for paginated responses.
 */
export function buildMeta(total: number, { page, limit }: PaginationParams) {
  return {
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
  }
}
