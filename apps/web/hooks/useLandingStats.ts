// ── hooks/useLandingStats.ts ──
import { useState, useEffect } from 'react'
import { api } from '@/lib/api-client'

export interface PublicStats {
  totalReports: number
  resolvedReports: number
  resolutionRate: number
  activeDinas: number
  satisfactionAvg: number | null
}

export function useLandingStats() {
  const [stats, setStats] = useState<PublicStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await api.get<{ success: true; data: PublicStats }>('/statistics/public')
        setStats(res.data)
      } catch (err) {
        console.error('Failed to fetch landing stats:', err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchStats()
  }, [])

  return { stats, isLoading }
}
