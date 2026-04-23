// ── apps/api/src/lib/cache.ts ──
// Redis cache utility functions for analytics and performance optimization

import { redis } from './redis.js'

/**
 * Generic cache wrapper with automatic JSON serialization
 * 
 * @param key - Redis cache key
 * @param fetcher - Async function to fetch data on cache miss
 * @param ttlSeconds - Time-to-live in seconds
 * @returns Cached or freshly fetched data
 * 
 * @example
 * const data = await getCached(
 *   'analytics:overview:agency-123:30',
 *   async () => await db.report.aggregate(...),
 *   300 // 5 minutes
 * )
 */
export async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number
): Promise<T> {
  try {
    // Try cache first
    const cached = await redis.get(key)
    if (cached) {
      return JSON.parse(cached) as T
    }

    // Cache miss - fetch from database
    const data = await fetcher()

    // Store in cache with TTL
    await redis.setex(key, ttlSeconds, JSON.stringify(data))

    return data
  } catch (error) {
    console.error(`Cache error for key ${key}:`, error)
    // On cache failure, fallback to direct fetch
    return await fetcher()
  }
}

/**
 * Invalidate cache keys matching a pattern
 * 
 * @param pattern - Redis key pattern (supports * wildcard)
 * 
 * @example
 * // Invalidate all analytics cache for an agency
 * await invalidatePattern('analytics:*:agency-123:*')
 * 
 * // Invalidate specific metric across all periods
 * await invalidatePattern('analytics:overview:*')
 */
export async function invalidatePattern(pattern: string): Promise<void> {
  try {
    const keys = await redis.keys(pattern)
    if (keys.length > 0) {
      await redis.del(...keys)
      console.log(`✓ Invalidated ${keys.length} cache keys matching: ${pattern}`)
    }
  } catch (error) {
    console.error(`Failed to invalidate pattern ${pattern}:`, error)
  }
}
