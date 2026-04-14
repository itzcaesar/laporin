// ── apps/api/src/services/storage.service.ts ──
// File storage service for Supabase S3-compatible storage

import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { env } from '../env.js'

/**
 * Initialize S3 client for Supabase Storage
 * Supabase Storage is S3-compatible and requires forcePathStyle
 */
const s3Client = new S3Client({
  region: env.S3_REGION,
  endpoint: env.S3_ENDPOINT,
  credentials: {
    accessKeyId: env.S3_ACCESS_KEY,
    secretAccessKey: env.S3_SECRET_KEY,
  },
  forcePathStyle: true, // Required for Supabase S3-compatible storage
})

/**
 * File size limits by media type
 */
const FILE_SIZE_LIMITS = {
  photo: 10 * 1024 * 1024, // 10 MB
  video: 50 * 1024 * 1024, // 50 MB
  progress_photo: 10 * 1024 * 1024,
  completion_photo: 10 * 1024 * 1024,
}

/**
 * Allowed MIME types by media type
 */
const ALLOWED_MIME_TYPES = {
  photo: ['image/jpeg', 'image/png', 'image/webp'],
  video: ['video/mp4', 'video/quicktime'],
  progress_photo: ['image/jpeg', 'image/png', 'image/webp'],
  completion_photo: ['image/jpeg', 'image/png', 'image/webp'],
}

/**
 * Generate a presigned URL for uploading a file to Supabase Storage
 * 
 * @param params - Upload parameters
 * @returns Upload URL, file key, and public URL, or null if validation fails
 * 
 * @example
 * const result = await generateUploadUrl({
 *   reportId: 'uuid',
 *   mediaType: 'photo',
 *   mimeType: 'image/jpeg',
 *   fileSizeBytes: 2048000
 * })
 * 
 * if (result) {
 *   // Client uploads directly to result.uploadUrl
 *   // Then saves result.fileKey and result.publicUrl to database
 * }
 */
export async function generateUploadUrl(params: {
  reportId: string
  mediaType: 'photo' | 'video' | 'progress_photo' | 'completion_photo'
  mimeType: string
  fileSizeBytes: number
}): Promise<{ uploadUrl: string; fileKey: string; publicUrl: string } | null> {
  const { reportId, mediaType, mimeType, fileSizeBytes } = params

  try {
    // Validate file size
    const maxSize = FILE_SIZE_LIMITS[mediaType]
    if (fileSizeBytes > maxSize) {
      console.error(
        `[Storage] File size ${fileSizeBytes} exceeds limit ${maxSize} for ${mediaType}`
      )
      return null
    }

    // Validate MIME type
    const allowedTypes = ALLOWED_MIME_TYPES[mediaType]
    if (!allowedTypes.includes(mimeType)) {
      console.error(`[Storage] MIME type ${mimeType} not allowed for ${mediaType}`)
      return null
    }

    // Generate file key with timestamp and UUID for uniqueness
    const timestamp = Date.now()
    const uuid = crypto.randomUUID()
    const extension = getFileExtension(mimeType)
    const fileKey = `reports/${reportId}/${mediaType}/${timestamp}-${uuid}.${extension}`
      .toLowerCase()
      .replace(/\s+/g, '-')

    console.log(`[Storage] Generating upload URL for: ${fileKey}`)

    // Create presigned PUT URL (expires in 5 minutes)
    const command = new PutObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: fileKey,
      ContentType: mimeType,
      ContentLength: fileSizeBytes,
      // Add cache control for images
      CacheControl: mediaType.includes('photo') ? 'public, max-age=31536000' : undefined,
    })

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 })

    // Generate public URL
    // Supabase Storage public URL format: https://{project}.supabase.co/storage/v1/object/public/{bucket}/{key}
    const publicUrl = `${env.S3_PUBLIC_URL}/${fileKey}`

    console.log(`[Storage] ✓ Upload URL generated (expires in 5 minutes)`)

    return {
      uploadUrl,
      fileKey,
      publicUrl,
    }
  } catch (error) {
    console.error('[Storage] Error generating upload URL:', error)
    return null
  }
}

/**
 * Delete a file from Supabase Storage
 * Used when a report is rejected or media needs to be removed
 * 
 * @param fileKey - The S3 key of the file to delete
 * @returns true if successful, false otherwise
 */
export async function deleteFile(fileKey: string): Promise<boolean> {
  try {
    console.log(`[Storage] Deleting file: ${fileKey}`)

    const command = new DeleteObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: fileKey,
    })

    await s3Client.send(command)
    
    console.log(`[Storage] ✓ File deleted successfully`)
    return true
  } catch (error) {
    console.error('[Storage] Error deleting file:', error)
    return false
  }
}

/**
 * Delete multiple files from Supabase Storage
 * Useful for cleaning up all media when a report is deleted
 * 
 * @param fileKeys - Array of S3 keys to delete
 * @returns Number of successfully deleted files
 */
export async function deleteFiles(fileKeys: string[]): Promise<number> {
  let successCount = 0

  for (const fileKey of fileKeys) {
    const success = await deleteFile(fileKey)
    if (success) successCount++
  }

  console.log(`[Storage] Deleted ${successCount}/${fileKeys.length} files`)
  return successCount
}

/**
 * Get public URL for a file
 * 
 * @param fileKey - The S3 key of the file
 * @returns Public URL for accessing the file
 */
export function getPublicUrl(fileKey: string): string {
  return `${env.S3_PUBLIC_URL}/${fileKey}`
}

/**
 * Generate a presigned URL for reading a private file
 * (Currently not used as all report media is public, but useful for future features)
 * 
 * @param fileKey - The S3 key of the file
 * @param expiresIn - Expiration time in seconds (default: 1 hour)
 * @returns Presigned GET URL
 */
export async function getSignedReadUrl(
  fileKey: string,
  expiresIn: number = 3600
): Promise<string | null> {
  try {
    const command = new GetObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: fileKey,
    })

    const url = await getSignedUrl(s3Client, command, { expiresIn })
    return url
  } catch (error) {
    console.error('[Storage] Error generating signed read URL:', error)
    return null
  }
}

/**
 * Get file extension from MIME type
 * 
 * @param mimeType - MIME type string
 * @returns File extension without dot
 */
function getFileExtension(mimeType: string): string {
  const mimeToExt: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'video/mp4': 'mp4',
    'video/quicktime': 'mov',
  }

  return mimeToExt[mimeType] || mimeType.split('/')[1]
}

/**
 * Validate file metadata before upload
 * 
 * @param params - File metadata to validate
 * @returns Validation result with error message if invalid
 */
export function validateFileMetadata(params: {
  mediaType: string
  mimeType: string
  fileSizeBytes: number
}): { valid: boolean; error?: string } {
  const { mediaType, mimeType, fileSizeBytes } = params

  // Check if media type is valid
  if (!['photo', 'video', 'progress_photo', 'completion_photo'].includes(mediaType)) {
    return {
      valid: false,
      error: `Invalid media type: ${mediaType}`,
    }
  }

  // Check file size
  const maxSize = FILE_SIZE_LIMITS[mediaType as keyof typeof FILE_SIZE_LIMITS]
  if (fileSizeBytes > maxSize) {
    return {
      valid: false,
      error: `File size ${(fileSizeBytes / 1024 / 1024).toFixed(2)}MB exceeds limit ${(maxSize / 1024 / 1024).toFixed(0)}MB`,
    }
  }

  // Check MIME type
  const allowedTypes = ALLOWED_MIME_TYPES[mediaType as keyof typeof ALLOWED_MIME_TYPES]
  if (!allowedTypes.includes(mimeType)) {
    return {
      valid: false,
      error: `MIME type ${mimeType} not allowed. Allowed: ${allowedTypes.join(', ')}`,
    }
  }

  return { valid: true }
}
