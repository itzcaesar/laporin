// ── apps/api/src/validators/analytics.validator.ts ──
// Zod validation schemas for analytics endpoints

import { z } from 'zod'

/**
 * Query parameter validation for analytics endpoints
 * Validates time period selection (30, 90, or 365 days)
 */
export const analyticsOverviewQuerySchema = z.object({
  period: z.enum(['30', '90', '365'], {
    errorMap: () => ({ message: 'Period must be one of: 30, 90, or 365 days' })
  }).default('30')
})

export type AnalyticsOverviewQueryInput = z.infer<typeof analyticsOverviewQuerySchema>

// Legacy schema for backward compatibility with existing endpoints
export const analyticsQuerySchema = z.object({
  period: z.enum(['30', '90', '365'], {
    errorMap: () => ({ message: 'Period must be one of: 30, 90, or 365 days' })
  }).default('30')
})

export type AnalyticsQueryInput = z.infer<typeof analyticsQuerySchema>

/**
 * Request body validation for PDF/Excel export endpoints
 */
export const exportRequestSchema = z.object({
  period: z.enum(['30', '90', '365'], {
    errorMap: () => ({ message: 'Period must be one of: 30, 90, or 365 days' })
  }),
  includeCharts: z.boolean().default(true)
})

export type ExportRequestInput = z.infer<typeof exportRequestSchema>
