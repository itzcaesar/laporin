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

  // Web Push (VAPID)
  VAPID_PUBLIC_KEY: z.string().optional(),
  VAPID_PRIVATE_KEY: z.string().optional(),
  VAPID_SUBJECT: z.string().email().optional(),

  // App
  PORT: z.coerce.number().int().positive().default(4000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  ALLOWED_ORIGINS: z.string().min(1),
})

/**
 * Validates and exports environment variables.
 * Throws an error if validation fails.
 * 
 * This function is called immediately when this module is imported,
 * ensuring the server cannot start with invalid configuration.
 */
function validateEnv() {
  console.log('🔍 Validating environment variables...')
  
  const result = envSchema.safeParse(process.env)

  if (!result.success) {
    console.error('❌ Invalid environment variables:')
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
    const errors = result.error.flatten().fieldErrors
    
    // Group errors by category
    const authErrors: string[] = []
    const dbErrors: string[] = []
    const storageErrors: string[] = []
    const aiErrors: string[] = []
    const emailErrors: string[] = []
    const otherErrors: string[] = []
    
    for (const [field, messages] of Object.entries(errors)) {
      const errorMsg = `  • ${field}: ${messages?.join(', ')}`
      
      if (field.startsWith('JWT') || field === 'VAPID_PUBLIC_KEY' || field === 'VAPID_PRIVATE_KEY') {
        authErrors.push(errorMsg)
      } else if (field.includes('DATABASE') || field.includes('REDIS')) {
        dbErrors.push(errorMsg)
      } else if (field.startsWith('S3_')) {
        storageErrors.push(errorMsg)
      } else if (field.includes('API_KEY')) {
        aiErrors.push(errorMsg)
      } else if (field.startsWith('SMTP_')) {
        emailErrors.push(errorMsg)
      } else {
        otherErrors.push(errorMsg)
      }
    }
    
    if (dbErrors.length > 0) {
      console.error('\n📊 Database & Cache:')
      dbErrors.forEach(err => console.error(err))
    }
    
    if (authErrors.length > 0) {
      console.error('\n🔐 Authentication:')
      authErrors.forEach(err => console.error(err))
    }
    
    if (storageErrors.length > 0) {
      console.error('\n💾 Storage:')
      storageErrors.forEach(err => console.error(err))
    }
    
    if (aiErrors.length > 0) {
      console.error('\n🤖 AI Services:')
      aiErrors.forEach(err => console.error(err))
    }
    
    if (emailErrors.length > 0) {
      console.error('\n📧 Email:')
      emailErrors.forEach(err => console.error(err))
    }
    
    if (otherErrors.length > 0) {
      console.error('\n⚙️  Other:')
      otherErrors.forEach(err => console.error(err))
    }
    
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.error('\n💡 Tip: Copy .env.example to .env and fill in the values')
    console.error('   See: apps/api/.env.example\n')
    
    throw new Error('Environment validation failed - server cannot start')
  }

  console.log('✓ Environment variables validated successfully')
  return result.data
}

export const env = validateEnv()

// Type export for use in other files
export type Env = z.infer<typeof envSchema>
