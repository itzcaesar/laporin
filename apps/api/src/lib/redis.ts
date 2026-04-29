// ── apps/api/src/lib/redis.ts ──
// Redis client singleton for caching and rate limiting

import { Redis } from 'ioredis'
import { env } from '../env.js'

/**
 * Redis availability flag
 * Used for graceful degradation when Redis is unavailable
 */
let redisAvailable = true
let reconnectAttempts = 0
const MAX_RECONNECT_ATTEMPTS = 10

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
    reconnectAttempts = times
    
    // Stop retrying after MAX_RECONNECT_ATTEMPTS
    if (times > MAX_RECONNECT_ATTEMPTS) {
      console.error(`Redis: Max reconnection attempts (${MAX_RECONNECT_ATTEMPTS}) reached. Giving up.`)
      redisAvailable = false
      return null // Stop retrying
    }
    
    const delay = Math.min(times * 50, 2000)
    console.log(`Redis: Reconnection attempt ${times}, retrying in ${delay}ms...`)
    return delay
  },
  reconnectOnError(err: Error) {
    const targetError = 'READONLY'
    if (err.message.includes(targetError)) {
      // Only reconnect when the error contains "READONLY"
      console.log('Redis: Reconnecting due to READONLY error')
      return true
    }
    return false
  },
  enableOfflineQueue: false, // Don't queue commands when disconnected
  lazyConnect: false, // Connect immediately
})

redis.on('error', (err: Error) => {
  console.error('Redis connection error:', err.message)
  redisAvailable = false
})

redis.on('connect', () => {
  console.log('✓ Redis connected')
  redisAvailable = true
  reconnectAttempts = 0
})

redis.on('ready', () => {
  console.log('✓ Redis ready')
  redisAvailable = true
})

redis.on('close', () => {
  console.warn('⚠️  Redis connection closed')
  redisAvailable = false
})

redis.on('reconnecting', () => {
  console.log('🔄 Redis reconnecting...')
})

/**
 * Check if Redis is available
 * Use this before attempting Redis operations for graceful degradation
 */
export function isRedisAvailable(): boolean {
  return redisAvailable && redis.status === 'ready'
}

/**
 * Safe Redis get with fallback
 * Returns null if Redis is unavailable instead of throwing
 */
export async function safeGet(key: string): Promise<string | null> {
  if (!isRedisAvailable()) {
    console.warn(`Redis unavailable, skipping GET ${key}`)
    return null
  }
  
  try {
    return await redis.get(key)
  } catch (error) {
    console.error(`Redis GET error for key ${key}:`, error)
    redisAvailable = false
    return null
  }
}

/**
 * Safe Redis set with fallback
 * Returns false if Redis is unavailable instead of throwing
 */
export async function safeSet(
  key: string,
  value: string,
  expiryMode?: 'EX' | 'PX',
  time?: number
): Promise<boolean> {
  if (!isRedisAvailable()) {
    console.warn(`Redis unavailable, skipping SET ${key}`)
    return false
  }
  
  try {
    if (expiryMode && time) {
      await redis.set(key, value, expiryMode, time)
    } else {
      await redis.set(key, value)
    }
    return true
  } catch (error) {
    console.error(`Redis SET error for key ${key}:`, error)
    redisAvailable = false
    return false
  }
}

/**
 * Safe Redis setex with fallback
 */
export async function safeSetex(
  key: string,
  seconds: number,
  value: string
): Promise<boolean> {
  if (!isRedisAvailable()) {
    console.warn(`Redis unavailable, skipping SETEX ${key}`)
    return false
  }
  
  try {
    await redis.setex(key, seconds, value)
    return true
  } catch (error) {
    console.error(`Redis SETEX error for key ${key}:`, error)
    redisAvailable = false
    return false
  }
}

/**
 * Safe Redis del with fallback
 */
export async function safeDel(key: string): Promise<boolean> {
  if (!isRedisAvailable()) {
    console.warn(`Redis unavailable, skipping DEL ${key}`)
    return false
  }
  
  try {
    await redis.del(key)
    return true
  } catch (error) {
    console.error(`Redis DEL error for key ${key}:`, error)
    redisAvailable = false
    return false
  }
}

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
