// ── apps/api/src/lib/redis.ts ──
// Redis client singleton for caching and rate limiting

import { Redis } from 'ioredis'
import { env } from '../env.js'

/**
 * Redis client singleton
 * Used for:
 * - Rate limiting
 * - OTP storage
 * - Dashboard stats caching
 * - Map data caching
 */
export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy(times: number) {
    const delay = Math.min(times * 50, 2000)
    return delay
  },
  reconnectOnError(err: Error) {
    const targetError = 'READONLY'
    if (err.message.includes(targetError)) {
      // Only reconnect when the error contains "READONLY"
      return true
    }
    return false
  },
})

redis.on('error', (err: Error) => {
  console.error('Redis connection error:', err)
})

redis.on('connect', () => {
  console.log('✓ Redis connected')
})

/**
 * Graceful shutdown
 */
export async function disconnectRedis() {
  if (redis) {
    await redis.quit()
    console.log('✓ Redis disconnected')
  }
}

// Export default for convenience
export default redis
