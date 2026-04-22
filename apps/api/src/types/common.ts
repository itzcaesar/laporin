// ── apps/api/src/types/common.ts ──
// Common type definitions for type safety

import type { Prisma } from '@prisma/client'

/**
 * Prisma where clause types for common models
 */
export type ReportWhereInput = Prisma.ReportWhereInput
export type UserWhereInput = Prisma.UserWhereInput
export type CategoryWhereInput = Prisma.CategoryWhereInput

/**
 * Query result types for raw SQL queries
 */
export interface HeatmapPoint {
  lat: number
  lng: number
  intensity: number
}

export interface CategoryCount {
  categoryId: number
  _count: number
}

export interface StatusCount {
  status: string
  _count: number
}

export interface OfficerPerformance {
  officer_id: string
  officer_name: string
  total_assigned: bigint
  total_completed: bigint
  avg_resolution_days: number | null
}

export interface AgencyPerformance {
  agency_id: string
  agency_name: string
  total_reports: bigint
  total_completed: bigint
  avg_resolution_days: number | null
}

export interface ResolutionTime {
  bucket: string
  count: bigint
}

export interface WeeklyCount {
  week: number
  count: bigint
}

export interface RegionCount {
  region_code: string
  count: bigint
}

/**
 * Chart data types
 */
export interface ChartDataPoint {
  name: string
  value: number
  [key: string]: string | number
}

export interface TimeSeriesPoint {
  date: string
  value: number
  label?: string
}

export interface CategoryBreakdown {
  categoryId: number
  categoryName: string
  emoji: string
  count: number
}

/**
 * API response types
 */
export interface ApiSuccessResponse<T> {
  data: T
  cached?: boolean
}

export interface ApiErrorResponse {
  error: string
  details?: unknown
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

/**
 * OpenRouter API types
 */
export interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant'
  content: string | OpenRouterContentPart[]
}

export interface OpenRouterContentPart {
  type: 'text' | 'image_url'
  text?: string
  image_url?: {
    url: string
  }
}

export interface OpenRouterResponse {
  choices: Array<{
    message: {
      content: string
    }
  }>
}

/**
 * AI Analysis types
 */
export interface DangerLevelResult {
  dangerLevel: 'low' | 'medium' | 'high' | 'critical'
  reasoning: string
}

export interface HoaxDetectionResult {
  isHoax: boolean
  confidence: number
  reason: string
}

export interface DuplicateDetectionResult {
  isDuplicate: boolean
  similarReportId?: string
  similarity?: number
}

export interface BudgetEstimate {
  minIdr: number
  maxIdr: number
  basis: string
}

export interface PhotoVerificationResult {
  progressDetected: boolean
  confidence: number
  description: string
  concerns: string | null
}

/**
 * Workload prediction types
 */
export interface WorkloadPrediction {
  predictedWeeklyTotal: number
  bySubdistrict: SubdistrictPrediction[]
  recommendation: string | null
}

export interface SubdistrictPrediction {
  code: string
  predicted: number
  currentStaff: number
}
