// S3 upload helper for seed photos
import * as fs from 'fs'
import * as path from 'path'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

const SEED_PHOTO_DIR = path.resolve(import.meta.dirname, 'seed_photo')

let s3Client: S3Client | null = null

function getS3() {
  if (!s3Client) {
    // Supabase S3 endpoint format: https://<project>.storage.supabase.co/storage/v1/s3
    const rawEndpoint = process.env.S3_ENDPOINT!
    const endpoint = rawEndpoint.includes('/storage/v1/s3')
      ? rawEndpoint
      : `${rawEndpoint}/storage/v1/s3`
    
    console.log(`[S3] Using endpoint: ${endpoint}`)
    
    s3Client = new S3Client({
      region: process.env.S3_REGION!,
      endpoint,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY!,
        secretAccessKey: process.env.S3_SECRET_KEY!,
      },
      forcePathStyle: true,
    })
  }
  return s3Client
}

export async function uploadSeedPhoto(
  photoDir: string,
  fileName: string,
  reportId: string,
  sortOrder: number,
): Promise<{ fileUrl: string; fileKey: string; fileSizeKb: number; mimeType: string }> {
  const localPath = path.join(SEED_PHOTO_DIR, photoDir, fileName)
  const fileBuffer = fs.readFileSync(localPath)
  const fileSizeKb = Math.round(fileBuffer.length / 1024)

  const ext = path.extname(fileName).toLowerCase()
  const mimeType = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg'

  const fileKey = `reports/${reportId}/photo/seed-${sortOrder}-${Date.now()}.${ext.replace('.', '')}`

  await getS3().send(new PutObjectCommand({
    Bucket: process.env.S3_BUCKET!,
    Key: fileKey,
    Body: fileBuffer,
    ContentType: mimeType,
    CacheControl: 'public, max-age=31536000',
  }))

  const fileUrl = `${process.env.S3_PUBLIC_URL}/${fileKey}`
  return { fileUrl, fileKey, fileSizeKb, mimeType }
}
