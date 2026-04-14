// ── apps/api/src/validators/report.validator.ts ──
// Zod validation schemas for report endpoints

import { z } from 'zod'

/**
 * Indonesia geographic bounds validation
 * Latitude: -11 (south) to 6 (north)
 * Longitude: 95 (west) to 141 (east)
 */
const indonesiaLatSchema = z
  .number()
  .min(-11, 'Latitude must be within Indonesia bounds')
  .max(6, 'Latitude must be within Indonesia bounds')

const indonesiaLngSchema = z
  .number()
  .min(95, 'Longitude must be within Indonesia bounds')
  .max(141, 'Longitude must be within Indonesia bounds')

/**
 * POST /reports
 * Create a new report (authenticated or anonymous)
 */
export const createReportSchema = z.object({
  title: z.string().min(10, 'Title must be at least 10 characters').max(200),
  description: z.string().min(20, 'Description must be at least 20 characters').max(2000),
  categoryId: z.number().int().positive('Invalid category ID'),
  locationLat: indonesiaLatSchema,
  locationLng: indonesiaLngSchema,
  locationAddress: z.string().min(10).max(500),
  regionCode: z.string().length(4, 'Region code must be 4 characters'), // BPS code
  regionName: z.string().min(3).max(100),
  isAnonymous: z.boolean().default(false),
})

export type CreateReportInput = z.infer<typeof createReportSchema>

/**
 * GET /reports
 * List reports with filters and pagination
 */
export const listReportsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.enum(['new', 'verified', 'in_progress', 'completed', 'verified_complete', 'rejected', 'disputed', 'closed']).optional(),
  categoryId: z.coerce.number().int().positive().optional(),
  regionCode: z.string().length(4).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  search: z.string().min(3).max(100).optional(),
  sortBy: z.enum(['createdAt', 'upvoteCount', 'priorityScore', 'dangerLevel']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

export type ListReportsInput = z.infer<typeof listReportsSchema>

/**
 * POST /reports/:id/media/upload-url
 * Request presigned URL for media upload
 */
export const requestUploadUrlSchema = z.object({
  mediaType: z.enum(['photo', 'video']),
  mimeType: z.string().regex(/^(image\/(jpeg|png|webp)|video\/(mp4|quicktime))$/, 'Invalid MIME type'),
  fileSizeBytes: z.number().int().positive().max(50 * 1024 * 1024, 'File size must not exceed 50MB'),
})

export type RequestUploadUrlInput = z.infer<typeof requestUploadUrlSchema>

/**
 * POST /reports/:id/media
 * Confirm media upload after client uploads to S3
 */
export const confirmMediaUploadSchema = z.object({
  fileKey: z.string().min(1, 'File key is required'),
  mediaType: z.enum(['photo', 'video']),
})

export type ConfirmMediaUploadInput = z.infer<typeof confirmMediaUploadSchema>

/**
 * POST /reports/:id/comments
 * Add a comment to a report
 */
export const createCommentSchema = z.object({
  content: z.string().min(3, 'Comment must be at least 3 characters').max(1000),
  parentId: z.string().uuid().optional(), // For threaded comments (1 level only)
})

export type CreateCommentInput = z.infer<typeof createCommentSchema>

/**
 * POST /reports/:id/rating
 * Rate completed work (satisfaction rating)
 */
export const createRatingSchema = z.object({
  rating: z.number().int().min(1).max(5, 'Rating must be between 1 and 5'),
  comment: z.string().max(500).optional(),
})

export type CreateRatingInput = z.infer<typeof createRatingSchema>

/**
 * POST /reports/:id/verify-complete
 * Citizen confirms work is actually completed
 */
export const verifyCompleteSchema = z.object({
  isComplete: z.boolean(),
  note: z.string().max(500).optional(),
})

export type VerifyCompleteInput = z.infer<typeof verifyCompleteSchema>

/**
 * Report ID parameter validation
 */
export const reportIdSchema = z.object({
  id: z.string().uuid('Invalid report ID'),
})

export type ReportIdParam = z.infer<typeof reportIdSchema>
