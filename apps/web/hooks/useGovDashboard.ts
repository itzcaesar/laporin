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

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const statsRes = await api.get<ApiResponse<GovDashboardStats>>('/gov/dashboard/stats');
      setStats(statsRes.data);
    } catch (err: any) {
      setError(
        err instanceof ApiClientError ? err.userMessage : 'Gagal memuat dasbor.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const generateInsights = async () => {
    try {
      await api.post('/gov/analytics/insights/generate', {});
      await fetchData();
    } catch (err: any) {
      throw new Error(err.message || 'Gagal membuat ulang insight');
    }
  };

  return { stats, isLoading, error, refetch: fetchData, generateInsights };
}
