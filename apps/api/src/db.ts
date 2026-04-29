// ── apps/api/src/db.ts ──
// Prisma client singleton
// Ensures only one instance of PrismaClient exists

import { PrismaClient } from '@prisma/client'
import { env } from './env.js'

/**
 * Global type augmentation for PrismaClient singleton
 */
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

/**
 * Creates or returns the singleton PrismaClient instance.
 * In development, uses global variable to prevent multiple instances during hot reload.
 * In production, creates a new instance with optimized connection pooling.
 * 
 * Connection Pool Optimization:
 * - Pool size calculated using Little's Law: (avg_query_time × QPS) / 1000
 * - For typical load: 50ms avg query × 100 QPS = 5 connections
 * - Set to 20 for headroom and burst traffic
 * - Timeout set to 10s to prevent connection exhaustion
 * - Query timeout set to 15s to prevent long-running queries
 */
function createPrismaClient() {
  // Parse DATABASE_URL and add connection pool params
  const url = new URL(env.DATABASE_URL)
  
  // Connection pool configuration
  url.searchParams.set('connection_limit', '20')      // Max connections
  url.searchParams.set('pool_timeout', '10')          // Connection acquisition timeout (seconds)
  url.searchParams.set('connect_timeout', '10')       // Initial connection timeout (seconds)
  
  // Statement timeout (PostgreSQL-specific)
  // Prevents long-running queries from blocking the pool
  url.searchParams.set('statement_timeout', '15000')  // 15 seconds in milliseconds

  const client = new PrismaClient({
    log: env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: url.toString(),
      },
    },
  })

  // Log connection pool info in development
  if (env.NODE_ENV === 'development') {
    console.log('📊 Prisma connection pool configured:')
    console.log('   - Max connections: 20')
    console.log('   - Pool timeout: 10s')
    console.log('   - Connect timeout: 10s')
    console.log('   - Statement timeout: 15s')
  }

  return client
}

/**
 * Singleton PrismaClient instance
 */
export const db = globalThis.prisma ?? createPrismaClient()

// In development, store client in global to prevent multiple instances
if (env.NODE_ENV !== 'production') {
  globalThis.prisma = db
}

/**
 * Graceful shutdown handler
 */
process.on('beforeExit', async () => {
  await db.$disconnect()
  console.log('✓ Prisma disconnected')
})

/**
 * Health check function
 * Tests database connectivity
 */
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await db.$queryRaw`SELECT 1`
    return true
  } catch (error) {
    console.error('Database health check failed:', error)
    return false
  }
}
