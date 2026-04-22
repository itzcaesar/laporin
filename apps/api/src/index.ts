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
    origin: env.ALLOWED_ORIGINS.split(',').map((origin) => origin.trim()),
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['*'], // Allow all headers
    exposeHeaders: ['Content-Length', 'X-Request-Id'],
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
      error: 'Not found',
      path: c.req.path,
      method: c.req.method,
    },
    404
  )
})

/**
 * Global error handler
 */
app.onError((err, c) => {
  console.error('Unhandled error:', err)

  // Don't expose internal errors in production
  const message = env.NODE_ENV === 'production' ? 'Internal server error' : err.message

  return c.json(
    {
      error: message,
      ...(env.NODE_ENV === 'development' && { stack: err.stack }),
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
