// ── apps/api/src/env.ts ──
// Zod-validated environment variables
// All environment variables are validated at startup

import { config } from 'dotenv'
import { z } from 'zod'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// Load .env file from apps/api directory
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
config({ path: join(__dirname, '../.env') })

const envSchema = z.object({
  // Database (Supabase)
  DATABASE_URL: z.string().url(),
  DIRECT_URL: z.string().url(),

  // Redis
  REDIS_URL: z.string().url(),

  // Auth
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // Storage (Supabase S3 or Cloudflare R2)
  S3_ENDPOINT: z.string().url(),
  S3_REGION: z.string().min(1).default('ap-southeast-1'),
  S3_BUCKET: z.string().min(1),
  S3_ACCESS_KEY: z.string().min(1),
  S3_SECRET_KEY: z.string().min(1),
  S3_PUBLIC_URL: z.string().url(),

  // AI (OpenRouter or Anthropic)
  OPENROUTER_API_KEY: z.string().startsWith('sk-').optional(),
  ANTHROPIC_API_KEY: z.string().startsWith('sk-'),

  // Email (Resend)
  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.coerce.number().int().positive(),
  SMTP_USER: z.string().min(1),
  SMTP_PASS: z.string().min(1),
  SMTP_FROM: z.string().email(),

  // WhatsApp (Fonnte)
  FONNTE_TOKEN: z.string().optional(),

  // App
  PORT: z.coerce.number().int().positive().default(4000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  ALLOWED_ORIGINS: z.string().min(1),
})

/**
 * Validates and exports environment variables.
 * Throws an error if validation fails.
 */
function validateEnv() {
  const result = envSchema.safeParse(process.env)

  if (!result.success) {
    console.error('❌ Invalid environment variables:')
    console.error(result.error.flatten().fieldErrors)
    throw new Error('Environment validation failed')
  }

  return result.data
}

export const env = validateEnv()

// Type export for use in other files
export type Env = z.infer<typeof envSchema>
