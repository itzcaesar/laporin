// ── apps/api/src/index.ts ──
// Main entry point for the Laporin API
// Hono app with middleware and route mounting

import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { secureHeaders } from 'hono/secure-headers'
import { env } from './env.js'
import routes from './routes/index.js'
import { startNotificationWorker } from './jobs/workers/notification.worker.js'
import { createAIWorker } from './jobs/workers/ai.worker.js'
import { startAllCronJobs } from './jobs/cron.js'
import type { Worker } from 'bullmq'

/**
 * Main Hono application instance
 */
const app = new Hono()

/**
 * Global middleware
 */

// Request logging
app.use('*', logger())

// Security headers
app.use('*', secureHeaders())

// CORS configuration
app.use(
  '*',
  cors({
    origin: (origin, c) => {
      if (!origin) return env.ALLOWED_ORIGINS.split(',')[0]
      if (env.NODE_ENV === 'development') return origin
      const allowed = env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
      return allowed.includes(origin) ? origin : allowed[0]
    },
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    exposeHeaders: ['Content-Length', 'X-Request-Id', 'Content-Disposition'],
    credentials: true,
    maxAge: 86400, // 24 hours
  })
)

/**
 * Root health check
 */
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    app: 'laporin-api',
    version: '1.0.0',
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
  })
})

/**
 * Mount API routes at /api/v1
 */
app.route('/api/v1', routes)

/**
 * 404 handler
 */
app.notFound((c) => {
  return c.json(
    {
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Endpoint tidak ditemukan',
      },
    },
    404
  )
})

/**
 * Global error handler
 */
app.onError((error, c) => {
  console.error('Unhandled error:', error)

  // Handle Zod validation errors
  if (error.name === 'ZodError') {
    const zodError = error as any
    const messages = zodError.errors?.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ')
    return c.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: messages || 'Data yang dikirim tidak valid',
        },
      },
      400
    )
  }

  // Handle Prisma errors
  if (error.message?.includes('Record to update not found') || error.message?.includes('Record to delete does not exist')) {
    return c.json(
      {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Data tidak ditemukan',
        },
      },
      404
    )
  }

  if (error.message?.includes('Unique constraint')) {
    return c.json(
      {
        success: false,
        error: {
          code: 'CONFLICT',
          message: 'Data sudah ada',
        },
      },
      409
    )
  }

  // Generic error response
  const message = env.NODE_ENV === 'production' ? 'Terjadi kesalahan server' : error.message

  return c.json(
    {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message,
      },
      ...(env.NODE_ENV === 'development' && { stack: error.stack }),
    },
    500
  )
})

/**
 * Start the server
 */
const port = env.PORT

// Start background workers
let notificationWorker: Worker | null = null
let aiWorker: Worker | null = null

try {
  notificationWorker = startNotificationWorker()
  aiWorker = createAIWorker()
  console.log('✓ Background workers initialized')
} catch (error) {
  console.error('Failed to start background workers:', error)
  console.warn('⚠️  API will run without background job processing')
}

// Start CRON jobs
try {
  startAllCronJobs()
  console.log('✓ CRON jobs initialized')
} catch (error) {
  console.error('Failed to start CRON jobs:', error)
  console.warn('⚠️  API will run without scheduled jobs')
}

serve(
  {
    fetch: app.fetch,
    port,
  },
  (info) => {
    console.log(`🚀 Laporin API running on http://localhost:${info.port}`)
    console.log(`📝 Environment: ${env.NODE_ENV}`)
    console.log(`🔗 Health check: http://localhost:${info.port}/health`)
    console.log(`🔗 API v1: http://localhost:${info.port}/api/v1`)
  }
)

/**
 * Graceful shutdown
 */
process.on('SIGINT', async () => {
  console.log('\n👋 Shutting down gracefully...')
  
  // Close background workers
  if (notificationWorker) {
    await notificationWorker.close()
    console.log('✓ Notification worker closed')
  }
  
  if (aiWorker) {
    await aiWorker.close()
    console.log('✓ AI worker closed')
  }
  
  process.exit(0)
})

process.on('SIGTERM', async () => {
  console.log('\n👋 Shutting down gracefully...')
  
  // Close background workers
  if (notificationWorker) {
    await notificationWorker.close()
    console.log('✓ Notification worker closed')
  }
  
  if (aiWorker) {
    await aiWorker.close()
    console.log('✓ AI worker closed')
  }
  
  process.exit(0)
})

export default app
