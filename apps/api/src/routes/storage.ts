// ── apps/api/src/routes/storage.ts ──
// Storage endpoints for file upload URL generation

import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { authMiddleware, type AuthVariables } from '../middleware/auth.js'
import { generateUploadUrl, validateFileMetadata } from '../services/storage.service.js'

const app = new Hono<{ Variables: AuthVariables }>()

/**
 * Request body schema for upload URL generation
 */
const uploadUrlSchema = z.object({
  reportId: z.string().uuid('Invalid report ID'),
  mediaType: z.enum(['photo', 'video', 'progress_photo', 'completion_photo'], {
    errorMap: () => ({ message: 'Invalid media type' }),
  }),
  mimeType: z.string().min(1, 'MIME type is required'),
  fileSizeBytes: z.number().int().positive('File size must be positive'),
  fileName: z.string().optional(),
})

/**
 * POST /storage/upload-url
 * Generate a presigned URL for uploading a file to Supabase Storage
 * 
 * Flow:
 * 1. Client requests upload URL with file metadata
 * 2. Server validates and generates presigned URL
 * 3. Client uploads directly to Supabase Storage using presigned URL
 * 4. Client calls POST /reports/:id/media with fileKey to save to database
 * 
 * This approach keeps file uploads off the API server and uses Supabase's CDN
 */
app.post(
  '/upload-url',
  authMiddleware, // Require authentication
  zValidator('json', uploadUrlSchema),
  async (c) => {
    try {
      const body = c.req.valid('json')
      const user = c.get('user')

      console.log(`[Storage] Upload URL request from user ${user.sub}`)

      // Validate file metadata
      const validation = validateFileMetadata({
        mediaType: body.mediaType,
        mimeType: body.mimeType,
        fileSizeBytes: body.fileSizeBytes,
      })

      if (!validation.valid) {
        return c.json(
          {
            error: 'Invalid file metadata',
            message: validation.error,
          },
          400
        )
      }

      // Generate presigned upload URL
      const result = await generateUploadUrl({
        reportId: body.reportId,
        mediaType: body.mediaType,
        mimeType: body.mimeType,
        fileSizeBytes: body.fileSizeBytes,
      })

      if (!result) {
        return c.json(
          {
            error: 'Failed to generate upload URL',
            message: 'Could not create presigned URL. Please try again.',
          },
          500
        )
      }

      return c.json({
        data: {
          uploadUrl: result.uploadUrl,
          fileKey: result.fileKey,
          publicUrl: result.publicUrl,
          expiresIn: 300, // 5 minutes
          instructions: {
            method: 'PUT',
            headers: {
              'Content-Type': body.mimeType,
              'Content-Length': body.fileSizeBytes.toString(),
            },
            note: 'Upload the file to uploadUrl using PUT method, then save fileKey to database',
          },
        },
      })
    } catch (error) {
      console.error('[Storage] Error in upload-url endpoint:', error)
      return c.json(
        {
          error: 'Internal server error',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        500
      )
    }
  }
)

/**
 * POST /storage/batch-upload-url
 * Generate multiple presigned URLs for batch uploads (e.g., multiple photos)
 * 
 * Useful when a user wants to upload multiple files at once
 */
app.post(
  '/batch-upload-url',
  authMiddleware,
  zValidator(
    'json',
    z.object({
      reportId: z.string().uuid(),
      files: z
        .array(
          z.object({
            mediaType: z.enum(['photo', 'video', 'progress_photo', 'completion_photo']),
            mimeType: z.string(),
            fileSizeBytes: z.number().int().positive(),
            fileName: z.string().optional(),
          })
        )
        .min(1, 'At least one file is required')
        .max(10, 'Maximum 10 files per batch'),
    })
  ),
  async (c) => {
    try {
      const body = c.req.valid('json')
      const user = c.get('user')

      console.log(`[Storage] Batch upload URL request for ${body.files.length} files`)

      const results = []
      const errors = []

      for (let i = 0; i < body.files.length; i++) {
        const file = body.files[i]

        // Validate each file
        const validation = validateFileMetadata({
          mediaType: file.mediaType,
          mimeType: file.mimeType,
          fileSizeBytes: file.fileSizeBytes,
        })

        if (!validation.valid) {
          errors.push({
            index: i,
            fileName: file.fileName,
            error: validation.error,
          })
          continue
        }

        // Generate upload URL
        const result = await generateUploadUrl({
          reportId: body.reportId,
          mediaType: file.mediaType,
          mimeType: file.mimeType,
          fileSizeBytes: file.fileSizeBytes,
        })

        if (result) {
          results.push({
            index: i,
            fileName: file.fileName,
            uploadUrl: result.uploadUrl,
            fileKey: result.fileKey,
            publicUrl: result.publicUrl,
          })
        } else {
          errors.push({
            index: i,
            fileName: file.fileName,
            error: 'Failed to generate upload URL',
          })
        }
      }

      return c.json({
        data: {
          results,
          errors,
          expiresIn: 300,
          successCount: results.length,
          errorCount: errors.length,
        },
      })
    } catch (error) {
      console.error('[Storage] Error in batch-upload-url endpoint:', error)
      return c.json(
        {
          error: 'Internal server error',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        500
      )
    }
  }
)

/**
 * GET /storage/limits
 * Returns file size limits and allowed MIME types
 * Public endpoint for client-side validation
 */
app.get('/limits', (c) => {
  return c.json({
    data: {
      limits: {
        photo: {
          maxSizeBytes: 10 * 1024 * 1024,
          maxSizeMB: 10,
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
          allowedExtensions: ['jpg', 'jpeg', 'png', 'webp'],
        },
        video: {
          maxSizeBytes: 50 * 1024 * 1024,
          maxSizeMB: 50,
          allowedMimeTypes: ['video/mp4', 'video/quicktime'],
          allowedExtensions: ['mp4', 'mov'],
        },
        progress_photo: {
          maxSizeBytes: 10 * 1024 * 1024,
          maxSizeMB: 10,
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
          allowedExtensions: ['jpg', 'jpeg', 'png', 'webp'],
        },
        completion_photo: {
          maxSizeBytes: 10 * 1024 * 1024,
          maxSizeMB: 10,
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
          allowedExtensions: ['jpg', 'jpeg', 'png', 'webp'],
        },
      },
      notes: [
        'EXIF metadata should be stripped client-side before upload',
        'Images will be served via Supabase CDN',
        'Upload URLs expire in 5 minutes',
        'Use PUT method to upload to presigned URL',
      ],
    },
  })
})

export default app
