// ── hooks/useGovAnalytics.ts ──
// Government analytics hook - fetches all analytics data in parallel

import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api-client'
import type {
  TimePeriod,
  AnalyticsData,
  AnalyticsOverview,
  TrendDataPoint,
  CategoryDistribution,
  SlaMetrics,
  SatisfactionMetrics,
  Anomaly,
  CategoryTrend,
  OfficerPerformance,
  AiInsights,
} from '@/types/analytics'

// ─────────────────────────────────────────────────────────
// HOOK
// ─────────────────────────────────────────────────────────

/**
 * Fetches all government analytics data in parallel
 * 
 * **Validates: Requirements 12.1, 12.2, 12.3, 12.4, 12.5, 12.6**
 * 
 * @param period - Time period filter ('30' | '90' | '365' days)
 * @returns Analytics data, loading state, error state, and refetch function
 */
export function useGovAnalytics(period: TimePeriod) {
  const [data, setData] = useState<AnalyticsData>({
    overview: null,
    trends: null,
    categories: null,
    sla: null,
    satisfaction: null,
    anomalies: null,
    categoryTrends: null,
    officerPerformance: null,
    insights: null,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Fetch all analytics endpoints in parallel
      const [
        overviewRes,
        trendsRes,
        categoriesRes,
        slaRes,
        satisfactionRes,
        anomaliesRes,
        categoryTrendsRes,
        officerPerformanceRes,
        insightsRes,
      ] = await Promise.all([
        api.get<{ success: true; data: AnalyticsOverview }>(
          `/gov/analytics/overview?period=${period}`
        ),
        api.get<{ success: true; data: TrendDataPoint[] }>(
          `/gov/analytics/trends?period=${period}`
        ),
        api.get<{ success: true; data: CategoryDistribution[] }>(
          `/gov/analytics/categories?period=${period}`
        ),
        api.get<{ success: true; data: SlaMetrics }>(
          `/gov/analytics/sla?period=${period}`
        ),
        api.get<{ success: true; data: SatisfactionMetrics }>(
          `/gov/analytics/satisfaction?period=${period}`
        ),
        api.get<{ success: true; data: Anomaly[] }>(
          `/gov/analytics/anomalies`
        ),
        api.get<{ success: true; data: CategoryTrend[] }>(
          `/gov/analytics/category-trends?period=${period}`
        ),
        api.get<{ success: true; data: OfficerPerformance[] }>(
          `/gov/analytics/officer-performance?period=${period}`
        ),
        api.get<{ success: true; data: AiInsights }>(
          `/gov/analytics/insights`
        ),
      ])

      // Aggregate all responses into single data object
      setData({
        overview: overviewRes.data,
        trends: trendsRes.data,
        categories: categoriesRes.data,
        sla: slaRes.data,
        satisfaction: satisfactionRes.data,
        anomalies: anomaliesRes.data,
        categoryTrends: categoryTrendsRes.data,
        officerPerformance: officerPerformanceRes.data,
        insights: insightsRes.data,
      })
    } catch (err: any) {
      setError(err.userMessage || err.message || 'Gagal memuat analitik')
      // Keep previous data on error, don't reset to null
    } finally {
      setIsLoading(false)
    }
  }, [period])

  // Refetch when period changes
  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, isLoading, error, refetch: fetchData }
}
