// ── apps/api/src/routes/map.ts ──
// Map endpoints for GeoJSON pins and heatmap data

import { Hono } from 'hono'
import { db } from '../db.js'
import { redis } from '../lib/redis.js'
import { env } from '../env.js'

const app = new Hono()

/**
 * Cache TTL for map data (in seconds)
 */
const CACHE_TTL_MAP = parseInt(process.env.CACHE_TTL_MAP || '30')
const CACHE_TTL_HEATMAP = parseInt(process.env.CACHE_TTL_HEATMAP || '300')

/**
 * GET /map/pins
 * Returns GeoJSON FeatureCollection of all non-closed reports
 * Cached for 30 seconds
 */
app.get('/pins', async (c) => {
  try {
    const agencyId = c.req.query('agencyId') // Optional filter by agency

    // Generate cache key
    const cacheKey = `laporin:map:pins:${agencyId || 'all'}`

    // Try to get from cache
    const cached = await redis.get(cacheKey)
    if (cached) {
      console.log(`[Map] Cache hit: ${cacheKey}`)
      return c.json(JSON.parse(cached))
    }

    console.log(`[Map] Cache miss: ${cacheKey}`)

    // Query reports with location data
    const reports = await db.report.findMany({
      where: {
        status: {
          notIn: ['closed', 'rejected'],
        },
        ...(agencyId && { agencyId }),
      },
      select: {
        id: true,
        trackingCode: true,
        status: true,
        categoryId: true,
        dangerLevel: true,
        locationLat: true,
        locationLng: true,
        category: {
          select: {
            emoji: true,
            name: true,
          },
        },
      },
      take: 2000, // Limit to 2000 pins for performance
      orderBy: {
        priorityScore: 'desc',
      },
    })

    // Convert to GeoJSON FeatureCollection
    const geojson = {
      type: 'FeatureCollection',
      features: reports.map((report) => ({
        type: 'Feature',
        id: report.id,
        geometry: {
          type: 'Point',
          coordinates: [
            parseFloat(report.locationLng.toString()),
            parseFloat(report.locationLat.toString()),
          ],
        },
        properties: {
          trackingCode: report.trackingCode,
          status: report.status,
          categoryId: report.categoryId,
          categoryEmoji: report.category.emoji,
          categoryName: report.category.name,
          dangerLevel: report.dangerLevel,
        },
      })),
    }

    // Cache the result
    await redis.setex(cacheKey, CACHE_TTL_MAP, JSON.stringify(geojson))

    return c.json(geojson)
  } catch (error) {
    console.error('[Map] Error fetching pins:', error)
    return c.json(
      {
        error: 'Failed to fetch map pins',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    )
  }
})

/**
 * GET /map/heatmap
 * Returns density grid for heatmap visualization
 * Uses PostGIS ST_SquareGrid for spatial aggregation
 * Cached for 5 minutes
 */
app.get('/heatmap', async (c) => {
  try {
    const minLat = parseFloat(c.req.query('minLat') || '-11')
    const minLng = parseFloat(c.req.query('minLng') || '95')
    const maxLat = parseFloat(c.req.query('maxLat') || '6')
    const maxLng = parseFloat(c.req.query('maxLng') || '141')
    const days = parseInt(c.req.query('days') || '30')

    // Validate bounds (Indonesia)
    if (
      minLat < -11 ||
      maxLat > 6 ||
      minLng < 95 ||
      maxLng > 141 ||
      minLat >= maxLat ||
      minLng >= maxLng
    ) {
      return c.json(
        {
          error: 'Invalid bounds',
          message: 'Coordinates must be within Indonesia bounds',
        },
        400
      )
    }

    // Generate cache key
    const cacheKey = `laporin:map:heatmap:${minLat}:${minLng}:${maxLat}:${maxLng}:${days}`

    // Try to get from cache
    const cached = await redis.get(cacheKey)
    if (cached) {
      console.log(`[Map] Heatmap cache hit`)
      return c.json(JSON.parse(cached))
    }

    console.log(`[Map] Heatmap cache miss`)

    // Calculate date threshold
    const dateThreshold = new Date()
    dateThreshold.setDate(dateThreshold.getDate() - days)

    // PostGIS query for density grid
    // Note: This uses raw SQL because Prisma doesn't support PostGIS functions
    const gridSize = 0.01 // ~1km grid cells
    const heatmapData = await db.$queryRaw<
      Array<{ lat: number; lng: number; count: number }>
    >`
      WITH grid AS (
        SELECT 
          FLOOR(CAST(location_lat AS NUMERIC) / ${gridSize}) * ${gridSize} + ${gridSize} / 2 AS lat,
          FLOOR(CAST(location_lng AS NUMERIC) / ${gridSize}) * ${gridSize} + ${gridSize} / 2 AS lng
        FROM reports
        WHERE 
          location_lat BETWEEN ${minLat} AND ${maxLat}
          AND location_lng BETWEEN ${minLng} AND ${maxLng}
          AND created_at >= ${dateThreshold}
          AND status NOT IN ('closed', 'rejected')
      )
      SELECT 
        CAST(lat AS FLOAT) as lat,
        CAST(lng AS FLOAT) as lng,
        CAST(COUNT(*) AS INTEGER) as count
      FROM grid
      GROUP BY lat, lng
      HAVING COUNT(*) > 0
      ORDER BY count DESC
      LIMIT 1000
    `

    const result = {
      data: heatmapData,
      meta: {
        bounds: { minLat, minLng, maxLat, maxLng },
        days,
        totalPoints: heatmapData.length,
        gridSize,
      },
    }

    // Cache the result
    await redis.setex(cacheKey, CACHE_TTL_HEATMAP, JSON.stringify(result))

    return c.json(result)
  } catch (error) {
    console.error('[Map] Error fetching heatmap:', error)
    return c.json(
      {
        error: 'Failed to fetch heatmap data',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    )
  }
})

/**
 * GET /map/cluster
 * Returns clustered report counts for a given zoom level
 * Alternative to heatmap for marker clustering
 */
app.get('/cluster', async (c) => {
  try {
    const zoom = parseInt(c.req.query('zoom') || '10')
    const minLat = parseFloat(c.req.query('minLat') || '-11')
    const minLng = parseFloat(c.req.query('minLng') || '95')
    const maxLat = parseFloat(c.req.query('maxLat') || '6')
    const maxLng = parseFloat(c.req.query('maxLng') || '141')

    // Calculate cluster grid size based on zoom level
    // Higher zoom = smaller grid = more clusters
    const gridSize = zoom < 8 ? 0.5 : zoom < 12 ? 0.1 : 0.01

    const cacheKey = `laporin:map:cluster:${zoom}:${minLat}:${minLng}:${maxLat}:${maxLng}`

    // Try cache
    const cached = await redis.get(cacheKey)
    if (cached) {
      return c.json(JSON.parse(cached))
    }

    // Query clustered data
    const clusters = await db.$queryRaw<
      Array<{
        lat: number
        lng: number
        count: number
        avgDangerLevel: number
      }>
    >`
      SELECT 
        CAST(FLOOR(CAST(location_lat AS NUMERIC) / ${gridSize}) * ${gridSize} + ${gridSize} / 2 AS FLOAT) as lat,
        CAST(FLOOR(CAST(location_lng AS NUMERIC) / ${gridSize}) * ${gridSize} + ${gridSize} / 2 AS FLOAT) as lng,
        CAST(COUNT(*) AS INTEGER) as count,
        CAST(AVG(danger_level) AS FLOAT) as "avgDangerLevel"
      FROM reports
      WHERE 
        location_lat BETWEEN ${minLat} AND ${maxLat}
        AND location_lng BETWEEN ${minLng} AND ${maxLng}
        AND status NOT IN ('closed', 'rejected')
      GROUP BY 
        FLOOR(CAST(location_lat AS NUMERIC) / ${gridSize}),
        FLOOR(CAST(location_lng AS NUMERIC) / ${gridSize})
      HAVING COUNT(*) > 0
      ORDER BY count DESC
      LIMIT 500
    `

    const result = {
      data: clusters,
      meta: {
        zoom,
        gridSize,
        totalClusters: clusters.length,
      },
    }

    // Cache for 1 minute
    await redis.setex(cacheKey, 60, JSON.stringify(result))

    return c.json(result)
  } catch (error) {
    console.error('[Map] Error fetching clusters:', error)
    return c.json(
      {
        error: 'Failed to fetch cluster data',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    )
  }
})

export default app
