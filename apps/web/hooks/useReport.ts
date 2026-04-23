// ── hooks/useReport.ts ──
// Fetches a single report's full detail

'use client'
import { useState, useEffect, useCallback } from 'react'
import { api, ApiClientError } from '@/lib/api-client'
import type { ReportDetail, ApiResponse } from '@/types'

interface UseReportReturn {
  report:    ReportDetail | null
  isLoading: boolean
  error:     string | null
  refetch:   () => void
}

/**
 * Fetches a single report's full detail.
 * Returns null while loading, not an empty object.
 */
export function useReport(id: string, gov = false): UseReportReturn {
  const [report,    setReport]    = useState<ReportDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error,     setError]     = useState<string | null>(null)

  const endpoint = gov ? `/gov/reports/${id}` : `/reports/${id}`

  const fetchReport = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await api.get<ApiResponse<ReportDetail>>(endpoint)
      setReport(res.data)
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.userMessage
          : 'Gagal memuat laporan.'
      )
    } finally {
      setIsLoading(false)
    }
  }, [endpoint])

  useEffect(() => { fetchReport() }, [fetchReport])

  return { report, isLoading, error, refetch: fetchReport }
}
