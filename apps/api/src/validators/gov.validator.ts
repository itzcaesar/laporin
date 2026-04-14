// ── apps/api/src/validators/gov.validator.ts ──
// Zod validation schemas for government endpoints

import { z } from 'zod'

/**
 * NIP (Nomor Induk Pegawai) validation
 * Government employee ID: 18 digits
 */
const nipSchema = z
  .string()
  .length(18, 'NIP must be exactly 18 digits')
  .regex(/^\d{18}$/, 'NIP must contain only numbers')

/**
 * PATCH /gov/reports/:id/verify
 * Verify report validity
 */
export const verifyReportSchema = z.object({
  result: z.enum(['valid', 'hoax', 'duplicate', 'out_of_jurisdiction']),
  note: z.string().min(10, 'Note must be at least 10 characters').max(500),
  officerNip: nipSchema,
  duplicateOfId: z.string().uuid().optional(), // Required if result is 'duplicate'
})

export type VerifyReportInput = z.infer<typeof verifyReportSchema>

/**
 * PATCH /gov/reports/:id/assign
 * Assign report to officer (admin only)
 */
export const assignReportSchema = z.object({
  officerId: z.string().uuid('Invalid officer ID'),
  picNip: nipSchema,
  estimatedStart: z.string().datetime().optional(),
  estimatedEnd: z.string().datetime().optional(),
  budgetIdr: z.number().int().positive().optional(),
})

export type AssignReportInput = z.infer<typeof assignReportSchema>

/**
 * PATCH /gov/reports/:id/status
 * Update report status
 */
export const updateStatusSchema = z.object({
  newStatus: z.enum(['verified', 'in_progress', 'completed', 'rejected', 'closed']),
  note: z.string().min(10).max(500),
  officerNip: nipSchema,
})

export type UpdateStatusInput = z.infer<typeof updateStatusSchema>

/**
 * PATCH /gov/reports/:id/timeline
 * Update timeline and budget (admin only)
 */
export const updateTimelineSchema = z.object({
  estimatedStart: z.string().datetime().optional(),
  estimatedEnd: z.string().datetime().optional(),
  actualEnd: z.string().datetime().optional(),
  budgetIdr: z.number().int().positive().optional(),
  officerNip: nipSchema,
})

export type UpdateTimelineInput = z.infer<typeof updateTimelineSchema>

/**
 * PATCH /gov/reports/:id/priority
 * Manually override priority (admin only)
 */
export const updatePrioritySchema = z.object({
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  note: z.string().min(10).max(500),
  officerNip: nipSchema,
})

export type UpdatePriorityInput = z.infer<typeof updatePrioritySchema>

/**
 * POST /gov/reports/:id/media
 * Upload progress or completion photo
 */
export const uploadGovMediaSchema = z.object({
  fileKey: z.string().min(1),
  mediaType: z.enum(['progress_photo', 'completion_photo']),
})

export type UploadGovMediaInput = z.infer<typeof uploadGovMediaSchema>

/**
 * GET /gov/reports
 * List reports for government dashboard
 */
export const listGovReportsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.enum(['new', 'verified', 'in_progress', 'completed', 'verified_complete', 'rejected', 'disputed', 'closed']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  categoryId: z.coerce.number().int().positive().optional(),
  agencyId: z.string().uuid().optional(),
  assignedOfficerId: z.string().uuid().optional(),
  slaBreached: z.enum(['true', 'false']).optional(),
  sortBy: z.enum(['createdAt', 'priorityScore', 'upvoteCount', 'dangerLevel']).default('priorityScore'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

export type ListGovReportsInput = z.infer<typeof listGovReportsSchema>

/**
 * POST /gov/officers
 * Create new officer account (admin only)
 */
export const createOfficerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2).max(100),
  nip: nipSchema,
  agencyId: z.string().uuid(),
  role: z.enum(['officer', 'admin']).default('officer'),
  phone: z.string().regex(/^(\+62|62|0)[0-9]{9,12}$/).optional(),
})

export type CreateOfficerInput = z.infer<typeof createOfficerSchema>

/**
 * PATCH /gov/officers/:id
 * Update officer account (admin only)
 */
export const updateOfficerSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  agencyId: z.string().uuid().optional(),
  role: z.enum(['officer', 'admin']).optional(),
  phone: z.string().regex(/^(\+62|62|0)[0-9]{9,12}$/).optional(),
  isActive: z.boolean().optional(),
})

export type UpdateOfficerInput = z.infer<typeof updateOfficerSchema>

/**
 * GET /gov/analytics/trends
 * Analytics query parameters
 */
export const analyticsQuerySchema = z.object({
  period: z.enum(['7d', '30d', '90d', '365d']).default('30d'),
  regionCode: z.string().length(4).optional(),
  agencyId: z.string().uuid().optional(),
})

export type AnalyticsQueryInput = z.infer<typeof analyticsQuerySchema>

/**
 * GET /gov/export/pdf or /gov/export/excel
 * Export query parameters
 */
export const exportQuerySchema = z.object({
  reportIds: z.string().optional(), // Comma-separated UUIDs
  status: z.enum(['new', 'verified', 'in_progress', 'completed', 'verified_complete', 'rejected', 'disputed', 'closed']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  agencyId: z.string().uuid().optional(),
})

export type ExportQueryInput = z.infer<typeof exportQuerySchema>
