// ── hooks/useReports.ts ──
// Fetches paginated report list with filters

'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { api, ApiClientError } from '@/lib/api-client'
import type { ReportStatus } from '@laporin/types'
import type { Report, Priority, PaginationMeta, ApiResponse } from '@laporin/types'

export interface UseReportsParams {
  status?:     ReportStatus
  categoryId?: number
  priority?:   Priority
  search?:     string
  sortBy?:     'createdAt' | 'priorityScore' | 'upvoteCount'
  sortDir?:    'asc' | 'desc'
  page?:       number
  limit?:      number
  // Gov-only
  filter?:     'sla_breached' | 'unassigned' | 'hoax_flagged'
  officerId?:  string
  gov?:        boolean   // use /gov/reports endpoint if true
}

interface UseReportsReturn {
  reports:   Report[]
  meta:      PaginationMeta | null
  isLoading: boolean
  error:     string | null
  refetch:   () => void
}

/**
 * Fetches paginated report list. Supports both citizen and gov endpoints.
 * Returns empty array (not null) when no data — components can safely map.
 */
export function useReports(params: UseReportsParams = {}): UseReportsReturn {
  const [reports,   setReports]   = useState<Report[]>([])
  const [meta,      setMeta]      = useState<PaginationMeta | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error,     setError]     = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const { gov, ...queryParams } = params
  const endpoint = gov ? '/gov/reports' : '/reports'

  const queryString = new URLSearchParams(
    Object.entries(queryParams)
      .filter(([, v]) => v != null && v !== '')
      .map(([k, v]) => [k, String(v)])
  ).toString()

  const fetchReports = useCallback(async () => {
    abortRef.current?.abort()
    abortRef.current = new AbortController()

    setIsLoading(true)
    setError(null)

    try {
      const res = await api.get<ApiResponse<Report[]>>(
        `${endpoint}${queryString ? `?${queryString}` : ''}`,
        { signal: abortRef.current.signal }
      )
      setReports(res.data)
      setMeta(res.meta ?? null)
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return
      setError(
        err instanceof ApiClientError
          ? err.userMessage
          : 'Gagal memuat laporan. Coba lagi.'
      )
      setReports([])
    } finally {
      setIsLoading(false)
    }
  }, [endpoint, queryString])

  useEffect(() => {
    fetchReports()
    return () => abortRef.current?.abort()
  }, [fetchReports])

  return { reports, meta, isLoading, error, refetch: fetchReports }
}
