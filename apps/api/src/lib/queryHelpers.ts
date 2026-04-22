// ── apps/api/src/lib/queryHelpers.ts ──
// Optimized query helpers to prevent N+1 queries

import type { Prisma } from '@prisma/client'

/**
 * Standard pagination parameters
 */
export interface PaginationParams {
  page: number
  limit: number
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  total: number
  page: number
  limit: number
  pages: number
  hasNext: boolean
  hasPrev: boolean
}

/**
 * Calculate pagination metadata
 */
export function calculatePagination(
  total: number,
  page: number,
  limit: number
): PaginationMeta {
  const pages = Math.ceil(total / limit)
  return {
    total,
    page,
    limit,
    pages,
    hasNext: page < pages,
    hasPrev: page > 1,
  }
}

/**
 * Optimized report list select
 * Prevents N+1 queries by including only necessary relations
 */
export const reportListSelect = {
  id: true,
  trackingCode: true,
  title: true,
  aiSummary: true,
  status: true,
  priority: true,
  dangerLevel: true,
  priorityScore: true,
  categoryId: true,
  locationLat: true,
  locationLng: true,
  locationAddress: true,
  regionCode: true,
  regionName: true,
  upvoteCount: true,
  commentCount: true,
  viewCount: true,
  createdAt: true,
  updatedAt: true,
  // Optimized relations
  category: {
    select: {
      id: true,
      name: true,
      emoji: true,
      leadAgency: true,
    },
  },
  // Only first media for thumbnail
  media: {
    take: 1,
    select: {
      id: true,
      fileUrl: true,
      mediaType: true,
    },
    orderBy: {
      sortOrder: 'asc' as const,
    },
  },
  // Count relations instead of loading all
  _count: {
    select: {
      votes: true,
      comments: true,
    },
  },
} satisfies Prisma.ReportSelect

/**
 * Optimized report detail include
 * Includes all necessary relations for detail view
 */
export const reportDetailInclude = {
  category: {
    select: {
      id: true,
      name: true,
      emoji: true,
      leadAgency: true,
      defaultPriority: true,
    },
  },
  reporter: {
    select: {
      id: true,
      name: true,
      createdAt: true,
    },
  },
  assignedOfficer: {
    select: {
      id: true,
      name: true,
      nip: true,
      agency: {
        select: {
          id: true,
          name: true,
          shortName: true,
        },
      },
    },
  },
  agency: {
    select: {
      id: true,
      name: true,
      shortName: true,
      email: true,
      phone: true,
    },
  },
  media: {
    select: {
      id: true,
      fileUrl: true,
      mediaType: true,
      fileSizeKb: true,
      sortOrder: true,
      createdAt: true,
    },
    orderBy: {
      sortOrder: 'asc' as const,
    },
  },
  statusHistory: {
    select: {
      id: true,
      oldStatus: true,
      newStatus: true,
      note: true,
      createdAt: true,
      changedBy: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc' as const,
    },
    take: 20, // Limit history to recent 20 entries
  },
  rating: {
    select: {
      id: true,
      rating: true,
      review: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  },
  aiAnalysis: {
    select: {
      suggestedCategory: true,
      dangerLevel: true,
      priorityScore: true,
      isDuplicate: true,
      duplicateOfId: true,
      isHoax: true,
      hoaxConfidence: true,
      impactSummary: true,
      budgetEstimate: true,
      analysedAt: true,
    },
  },
  _count: {
    select: {
      comments: true,
      votes: true,
      bookmarks: true,
    },
  },
} satisfies Prisma.ReportInclude

/**
 * Optimized comment list include
 */
export const commentListInclude = {
  author: {
    select: {
      id: true,
      name: true,
      role: true,
    },
  },
  replies: {
    select: {
      id: true,
      content: true,
      isGovernment: true,
      createdAt: true,
      author: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
    },
    orderBy: {
      createdAt: 'asc' as const,
    },
    take: 5, // Limit nested replies
  },
  _count: {
    select: {
      replies: true,
    },
  },
} satisfies Prisma.CommentInclude

/**
 * Optimized user list select for government
 */
export const userListSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  nip: true,
  phone: true,
  isActive: true,
  isVerified: true,
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
} satisfies Prisma.UserSelect

/**
 * Build optimized where clause for report filtering
 */
export function buildReportWhereClause(filters: {
  status?: string
  categoryId?: number
  regionCode?: string
  priority?: string
  search?: string
  agencyId?: string
  assignedOfficerId?: string
  reporterId?: string
  dateFrom?: Date
  dateTo?: Date
}): Prisma.ReportWhereInput {
  const where: Prisma.ReportWhereInput = {}

  if (filters.status) {
    where.status = filters.status as any
  }

  if (filters.categoryId) {
    where.categoryId = filters.categoryId
  }

  if (filters.regionCode) {
    where.regionCode = filters.regionCode
  }

  if (filters.priority) {
    where.priority = filters.priority as any
  }

  if (filters.agencyId) {
    where.agencyId = filters.agencyId
  }

  if (filters.assignedOfficerId) {
    where.assignedOfficerId = filters.assignedOfficerId
  }

  if (filters.reporterId) {
    where.reporterId = filters.reporterId
  }

  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: 'insensitive' } },
      { description: { contains: filters.search, mode: 'insensitive' } },
      { trackingCode: { contains: filters.search, mode: 'insensitive' } },
    ]
  }

  if (filters.dateFrom || filters.dateTo) {
    where.createdAt = {}
    if (filters.dateFrom) {
      where.createdAt.gte = filters.dateFrom
    }
    if (filters.dateTo) {
      where.createdAt.lte = filters.dateTo
    }
  }

  return where
}

/**
 * Build optimized order by clause
 */
export function buildOrderByClause(
  sortBy: string = 'createdAt',
  sortOrder: 'asc' | 'desc' = 'desc'
): Prisma.ReportOrderByWithRelationInput {
  // Map common sort fields
  const sortFieldMap: Record<string, string> = {
    created: 'createdAt',
    updated: 'updatedAt',
    priority: 'priorityScore',
    votes: 'upvoteCount',
    comments: 'commentCount',
  }

  const field = sortFieldMap[sortBy] || sortBy

  return { [field]: sortOrder }
}

/**
 * Cursor-based pagination helper
 * More efficient for large datasets
 */
export interface CursorPaginationParams {
  cursor?: string
  limit: number
}

export function buildCursorPagination(params: CursorPaginationParams) {
  const { cursor, limit } = params

  return {
    take: limit + 1, // Take one extra to check if there's a next page
    ...(cursor && {
      skip: 1, // Skip the cursor
      cursor: { id: cursor },
    }),
  }
}

/**
 * Process cursor pagination results
 */
export function processCursorResults<T extends { id: string }>(
  results: T[],
  limit: number
): {
  data: T[]
  hasNext: boolean
  nextCursor: string | null
} {
  const hasNext = results.length > limit
  const data = hasNext ? results.slice(0, -1) : results
  const nextCursor = hasNext && data.length > 0 ? data[data.length - 1].id : null

  return { data, hasNext, nextCursor }
}

/**
 * Batch load helper to prevent N+1 queries
 * Use with DataLoader pattern
 */
export async function batchLoadByIds<T>(
  ids: string[],
  loader: (ids: string[]) => Promise<T[]>,
  getId: (item: T) => string
): Promise<Map<string, T>> {
  const items = await loader(ids)
  const map = new Map<string, T>()

  items.forEach((item) => {
    map.set(getId(item), item)
  })

  return map
}
