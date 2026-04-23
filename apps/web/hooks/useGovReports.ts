// ── hooks/useGovReports.ts ──
// Government reports list with filters and pagination

import { useState, useEffect } from 'react'
import { api } from '@/lib/api-client'

// ─────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────

type ReportStatus =
  | 'new'
  | 'verified'
  | 'in_progress'
  | 'completed'
  | 'verified_complete'
  | 'rejected'
  | 'disputed'
  | 'closed'

type Priority = 'low' | 'medium' | 'high' | 'urgent'

type GovReport = {
  id: string
  trackingCode: string
  title: string
  locationAddress: string
  status: ReportStatus
  priority: Priority
  dangerLevel: number
  priorityScore: number
  upvoteCount: number
  commentCount: number
  categoryId: number
  category: {
    id: number
    name: string
    emoji: string
  }
  reporter: {
    id: string
    name: string | null
  } | null
  assignedOfficer: {
    id: string
    name: string | null
    nip: string | null
  } | null
  agency: {
    id: string
    name: string
    shortName: string
  } | null
  _count: {
    media: number
    comments: number
    votes: number
  }
  createdAt: string
  updatedAt: string
  estimatedEnd: string | null
  aiAnalysis?: any
}

type GovReportsFilters = {
  status?: ReportStatus
  priority?: Priority
  categoryId?: number
  agencyId?: string
  assignedOfficerId?: string
  slaBreached?: boolean
  sortBy?: 'createdAt' | 'priorityScore' | 'upvoteCount'
  sortOrder?: 'asc' | 'desc'
}

type PaginationMeta = {
  total: number
  page: number
  limit: number
  pages: number
}

// ─────────────────────────────────────────────────────────
// HOOK
// ─────────────────────────────────────────────────────────

export function useGovReports(
  filters: GovReportsFilters = {},
  page = 1,
  limit = 20
) {
  const [data, setData] = useState<GovReport[]>([])
  const [meta, setMeta] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    limit: 20,
    pages: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Build query string
      const params = new URLSearchParams()
      params.append('page', page.toString())
      params.append('limit', limit.toString())

      if (filters.status) params.append('status', filters.status)
      if (filters.priority) params.append('priority', filters.priority)
      if (filters.categoryId) params.append('categoryId', filters.categoryId.toString())
      if (filters.agencyId) params.append('agencyId', filters.agencyId)
      if (filters.assignedOfficerId)
        params.append('assignedOfficerId', filters.assignedOfficerId)
      if (filters.slaBreached) params.append('slaBreached', 'true')
      if (filters.sortBy) params.append('sortBy', filters.sortBy)
      if (filters.sortOrder) params.append('sortOrder', filters.sortOrder)

      const response = await api.get<{
        success: true
        data: GovReport[]
        meta: PaginationMeta
      }>(`/gov/reports?${params.toString()}`)

      setData(response.data)
      setMeta(response.meta)
    } catch (err: any) {
      setError(err.message || 'Gagal memuat laporan')
      setData([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [
    page,
    limit,
    filters.status,
    filters.priority,
    filters.categoryId,
    filters.agencyId,
    filters.assignedOfficerId,
    filters.slaBreached,
    filters.sortBy,
    filters.sortOrder,
  ])

  const bulkAssign = async (reportIds: string[], officerId: string, picNip: string) => {
    await api.post('/gov/reports/bulk-assign', { reportIds, officerId, picNip })
    await fetchData()
  }

  const bulkUpdateStatus = async (reportIds: string[], status: string, note: string, officerNip: string) => {
    await api.post('/gov/reports/bulk-status', { reportIds, status, note, officerNip })
    await fetchData()
  }

  return { data, meta, isLoading, error, refetch: fetchData, bulkAssign, bulkUpdateStatus }
}
