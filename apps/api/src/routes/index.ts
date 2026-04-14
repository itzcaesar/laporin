// ── apps/api/src/routes/index.ts ──
// Main router that mounts all sub-routers at /api/v1

import { Hono } from 'hono'

// Import route handlers
import authRoutes from './auth.js'
import reportsRoutes from './reports.js'
import govRoutes from './gov/index.js'
import aiRoutes from './ai.js'
import mapRoutes from './map.js'
import statisticsRoutes from './statistics.js'
import categoriesRoutes from './categories.js'
import storageRoutes from './storage.js'
// import notificationsRoutes from './notifications.js'

const app = new Hono()

// Health check endpoint
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    service: 'laporin-api',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  })
})

// Mount route handlers
app.route('/auth', authRoutes)
app.route('/reports', reportsRoutes)
app.route('/gov', govRoutes)
app.route('/ai', aiRoutes)
app.route('/map', mapRoutes)
app.route('/statistics', statisticsRoutes)
app.route('/categories', categoriesRoutes)
app.route('/storage', storageRoutes)
// app.route('/notifications', notificationsRoutes)

// Placeholder routes for testing
app.get('/', (c) => {
  return c.json({
    message: 'Laporin API v1',
    endpoints: {
      health: '/api/v1/health',
      auth: '/api/v1/auth/*',
      reports: '/api/v1/reports/*',
      map: '/api/v1/map/*',
      statistics: '/api/v1/statistics/*',
      categories: '/api/v1/categories',
      storage: '/api/v1/storage/*',
      ai: '/api/v1/ai/*',
      notifications: '/api/v1/notifications/*',
      government: '/api/v1/gov/*',
    },
  })
})

export default app
