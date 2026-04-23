// ── apps/web/types/analytics.ts ──
// TypeScript type definitions for Government Analytics System

/**
 * Time period filter for analytics queries
 */
export type TimePeriod = '30' | '90' | '365'

/**
 * Analytics overview KPI summary
 */
export interface AnalyticsOverview {
  totalReports: number
  completedReports: number
  avgResolutionDays: number
  slaCompliancePercent: number
  cachedAt: string
}

/**
 * Single data point in trend visualization
 */
export interface TrendDataPoint {
  date: string  // YYYY-MM-DD
  count: number
}

/**
 * Category distribution data
 */
export interface CategoryDistribution {
  categoryId: number
  categoryName: string
  emoji: string
  count: number
}

/**
 * SLA compliance metrics
 */
export interface SlaMetrics {
  onTime: number
  breached: number
}

/**
 * Citizen satisfaction metrics
 */
export interface SatisfactionMetrics {
  averageRating: number | null
  totalRatings: number
}

/**
 * Anomaly detection result
 */
export interface Anomaly {
  id: string
  regionName: string
  categoryName: string
  spikePercent: number
  hoursAgo: number
  reportCount: number
}

/**
 * Category trend analysis (growth/decline)
 */
export interface CategoryTrend {
  categoryId: number
  categoryName: string
  emoji: string
  currentCount: number
  changePercent: number
}

/**
 * Officer performance metrics
 */
export interface OfficerPerformance {
  officerId: string
  officerName: string
  assignedCount: number
  completedCount: number
  avgResolutionDays: number
  avgRating: number | null
}

/**
 * AI-generated insights
 */
export interface AiInsights {
  insights: string[]
  generatedAt: string | null
}

/**
 * Complete analytics data structure
 */
export interface AnalyticsData {
  overview: AnalyticsOverview | null
  trends: TrendDataPoint[] | null
  categories: CategoryDistribution[] | null
  sla: SlaMetrics | null
  satisfaction: SatisfactionMetrics | null
  anomalies: Anomaly[] | null
  categoryTrends: CategoryTrend[] | null
  officerPerformance: OfficerPerformance[] | null
  insights: AiInsights | null
}
