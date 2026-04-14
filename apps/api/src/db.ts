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
 * In production, creates a new instance.
 */
function createPrismaClient() {
  const client = new PrismaClient({
    log: env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

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
})
