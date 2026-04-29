// Redis-backed sliding window rate limiter

import { Context, Next } from 'hono'
import { redis, isRedisAvailable } from '../lib/redis.js'

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
  /** Skip rate limiting if Redis is unavailable (default: true) */
  skipOnRedisError?: boolean
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
  const skipOnError = config.skipOnRedisError ?? true

  return async (c: Context, next: Next) => {
    // Check if Redis is available
    if (!isRedisAvailable()) {
      if (skipOnError) {
        console.warn(`Rate limit skipped (Redis unavailable): ${config.keyPrefix}`)
        await next()
        return
      } else {
        return c.json(
          {
            success: false,
            error: {
              code: 'SERVICE_UNAVAILABLE',
              message: 'Rate limiting service temporarily unavailable',
            },
          },
          503
        )
      }
    }

    // Generate rate limit key
    const identifier = config.keyGenerator
      ? config.keyGenerator(c)
      : c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown'

    const key = `${config.keyPrefix}:${identifier}`
    const now = Date.now()
    const windowStart = now - config.windowSeconds * 1000

    try {
      // Sliding window algorithm using sorted set
      const multi = redis.multi()

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
        // Redis error - handle based on config
        if (skipOnError) {
          console.error('Rate limit check failed - allowing request')
          await next()
          return
        } else {
          return c.json(
            {
              success: false,
              error: {
                code: 'SERVICE_UNAVAILABLE',
                message: 'Rate limiting service error',
              },
            },
            503
          )
        }
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
            success: false,
            error: {
              code: 'RATE_LIMIT_EXCEEDED',
              message: 'Terlalu banyak permintaan, silakan coba lagi nanti',
            },
            retryAfter,
          },
          429
        )
      }

      await next()
    } catch (error) {
      // Redis error - handle based on config
      console.error('Rate limit error:', error)
      
      if (skipOnError) {
        console.warn('Rate limit error - allowing request')
        await next()
      } else {
        return c.json(
          {
            success: false,
            error: {
              code: 'SERVICE_UNAVAILABLE',
              message: 'Rate limiting service error',
            },
          },
          503
        )
      }
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
  if (!isRedisAvailable()) {
    console.warn('Cannot clear rate limit: Redis unavailable')
    return
  }
  
  try {
    const key = `${keyPrefix}:${identifier}`
    await redis.del(key)
  } catch (error) {
    console.error('Error clearing rate limit:', error)
  }
}

/**
 * Gets current rate limit status for a key.
 * 
 * @param keyPrefix - Rate limit key prefix
 * @param identifier - User/IP identifier
 * @param windowSeconds - Time window in seconds
 * @returns Current request count in window, or -1 if Redis unavailable
 */
export async function getRateLimitStatus(
  keyPrefix: string,
  identifier: string,
  windowSeconds: number
): Promise<number> {
  if (!isRedisAvailable()) {
    console.warn('Cannot get rate limit status: Redis unavailable')
    return -1
  }

  try {
    const key = `${keyPrefix}:${identifier}`
    const now = Date.now()
    const windowStart = now - windowSeconds * 1000

    await redis.zremrangebyscore(key, 0, windowStart)
    const count = await redis.zcard(key)

    return count
  } catch (error) {
    console.error('Error getting rate limit status:', error)
    return -1
  }
}
