// ── hooks/useGovDashboard.ts ──
// Fetches government dashboard stats

'use client'
import { useState, useEffect } from 'react'
import { api, ApiClientError } from '@/lib/api-client'
import type { GovDashboardStats } from '@laporin/types'
import type { ApiResponse } from '@laporin/types'

/**
 * Fetches gov dashboard stats and workload forecast in parallel.
 */
export function useGovDashboard() {
  const [stats,     setStats]     = useState<GovDashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error,     setError]     = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      api.get<ApiResponse<GovDashboardStats>>('/gov/dashboard/stats'),
    ])
      .then(([statsRes]) => {
        setStats(statsRes.data)
      })
      .catch(err => {
        setError(
          err instanceof ApiClientError ? err.userMessage : 'Gagal memuat dasbor.'
        )
      })
      .finally(() => setIsLoading(false))
  }, [])

  return { stats, isLoading, error }
}
