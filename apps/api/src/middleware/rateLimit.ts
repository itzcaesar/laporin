// ── apps/api/src/middleware/rateLimit.ts ──
// Redis-backed sliding window rate limiter

import { Context, Next } from 'hono'
import { Redis } from 'ioredis'
import { env } from '../env.js'

/**
 * Redis client singleton
 */
let redis: Redis | null = null

/**
 * Gets or creates the Redis client.
 */
function getRedisClient(): Redis {
  if (!redis) {
    redis = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: true,
    })

    redis.on('error', (err: Error) => {
      console.error('Redis error:', err)
    })
  }

  return redis
}

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  /** Maximum number of requests allowed */
  max: number
  /** Time window in seconds */
  windowSeconds: number
  /** Key prefix for Redis (e.g., 'ratelimit:auth:login') */
  keyPrefix: string
  /** Custom key generator (defaults to IP address) */
  keyGenerator?: (c: Context) => string
}

/**
 * Creates a rate limiting middleware using Redis sliding window algorithm.
 * 
 * @param config - Rate limit configuration
 * @returns Middleware function
 * 
 * @example
 * ```typescript
 * // Limit login attempts: 5 per 15 minutes per IP
 * app.post('/auth/login', rateLimit({
 *   max: 5,
 *   windowSeconds: 900,
 *   keyPrefix: 'ratelimit:auth:login',
 * }), handler)
 * 
 * // Limit AI requests: 10 per hour per user
 * app.post('/ai/classify', authMiddleware, rateLimit({
 *   max: 10,
 *   windowSeconds: 3600,
 *   keyPrefix: 'ratelimit:ai:classify',
 *   keyGenerator: (c) => c.get('user').sub,
 * }), handler)
 * ```
 */
export function rateLimit(config: RateLimitConfig) {
  return async (c: Context, next: Next) => {
    const client = getRedisClient()

    // Generate rate limit key
    const identifier = config.keyGenerator
      ? config.keyGenerator(c)
      : c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown'

    const key = `${config.keyPrefix}:${identifier}`
    const now = Date.now()
    const windowStart = now - config.windowSeconds * 1000

    try {
      // Sliding window algorithm using sorted set
      const multi = client.multi()

      // Remove old entries outside the window
      multi.zremrangebyscore(key, 0, windowStart)

      // Add current request
      multi.zadd(key, now, `${now}`)

      // Count requests in window
      multi.zcard(key)

      // Set expiry on the key
      multi.expire(key, config.windowSeconds)

      const results = await multi.exec()

      if (!results) {
        // Redis error - allow request but log error
        console.error('Rate limit check failed - allowing request')
        await next()
        return
      }

      const count = results[2][1] as number

      // Set rate limit headers
      c.header('X-RateLimit-Limit', config.max.toString())
      c.header('X-RateLimit-Remaining', Math.max(0, config.max - count).toString())
      c.header('X-RateLimit-Reset', (now + config.windowSeconds * 1000).toString())

      if (count > config.max) {
        const retryAfter = Math.ceil(config.windowSeconds)
        c.header('Retry-After', retryAfter.toString())

        return c.json(
          {
            error: 'Too many requests',
            retryAfter,
          },
          429
        )
      }

      await next()
    } catch (error) {
      // Redis error - allow request but log error
      console.error('Rate limit error:', error)
      await next()
    }
  }
}

/**
 * Clears rate limit for a specific key (useful for testing or manual resets).
 * 
 * @param keyPrefix - Rate limit key prefix
 * @param identifier - User/IP identifier
 */
export async function clearRateLimit(keyPrefix: string, identifier: string): Promise<void> {
  const client = getRedisClient()
  const key = `${keyPrefix}:${identifier}`
  await client.del(key)
}

/**
 * Gets current rate limit status for a key.
 * 
 * @param keyPrefix - Rate limit key prefix
 * @param identifier - User/IP identifier
 * @param windowSeconds - Time window in seconds
 * @returns Current request count in window
 */
export async function getRateLimitStatus(
  keyPrefix: string,
  identifier: string,
  windowSeconds: number
): Promise<number> {
  const client = getRedisClient()
  const key = `${keyPrefix}:${identifier}`
  const now = Date.now()
  const windowStart = now - windowSeconds * 1000

  await client.zremrangebyscore(key, 0, windowStart)
  const count = await client.zcard(key)

  return count
}
