// Geocoding service using Nominatim (OpenStreetMap)

import { safeGet, safeSetex, isRedisAvailable } from '../lib/redis.js'

interface NominatimResponse {
  place_id: number
  licence: string
  osm_type: string
  osm_id: number
  lat: string
  lon: string
  display_name: string
  address: {
    road?: string
    suburb?: string
    city?: string
    county?: string
    state?: string
    postcode?: string
    country?: string
    country_code?: string
  }
  boundingbox: string[]
}

export interface GeocodingResult {
  latitude: number
  longitude: number
  formattedAddress: string
  address: {
    road?: string
    suburb?: string
    city?: string
    county?: string
    state?: string
    postcode?: string
    country?: string
  }
}

/**
 * Cache TTL for geocoding results (30 days)
 * Addresses don't change often, so we can cache for a long time
 */
const GEOCODING_CACHE_TTL = 30 * 24 * 60 * 60 // 30 days in seconds

/**
 * Round coordinates to 4 decimal places (~11m precision)
 * This allows cache hits for nearby coordinates
 */
function roundCoordinate(coord: number): number {
  return Math.round(coord * 10000) / 10000
}

/**
 * Generate cache key for reverse geocoding
 */
function getReverseGeocodeKey(lat: number, lng: number): string {
  const roundedLat = roundCoordinate(lat)
  const roundedLng = roundCoordinate(lng)
  return `geocode:reverse:${roundedLat},${roundedLng}`
}

/**
 * Generate cache key for forward geocoding
 */
function getForwardGeocodeKey(address: string, countryCode: string): string {
  // Normalize address for consistent caching
  const normalized = address.toLowerCase().trim().replace(/\s+/g, ' ')
  return `geocode:forward:${countryCode}:${normalized}`
}

/**
 * Reverse geocode: Convert lat/lng to address
 * Uses Nominatim (OpenStreetMap) API with Redis caching
 * 
 * @param latitude - Latitude coordinate
 * @param longitude - Longitude coordinate
 * @returns Address information or null if not found
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<GeocodingResult | null> {
  try {
    // Check cache first
    const cacheKey = getReverseGeocodeKey(latitude, longitude)
    
    if (isRedisAvailable()) {
      const cached = await safeGet(cacheKey)
      if (cached) {
        console.log(`[Geocoding] Cache hit for reverse: ${latitude},${longitude}`)
        return JSON.parse(cached)
      }
    }

    // Cache miss - fetch from Nominatim
    console.log(`[Geocoding] Cache miss for reverse: ${latitude},${longitude}, fetching from API`)
    
    // Nominatim API endpoint
    const url = new URL('https://nominatim.openstreetmap.org/reverse')
    url.searchParams.set('lat', latitude.toString())
    url.searchParams.set('lon', longitude.toString())
    url.searchParams.set('format', 'json')
    url.searchParams.set('addressdetails', '1')
    url.searchParams.set('accept-language', 'id') // Indonesian language

    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'Laporin/1.0 (Civic Infrastructure Reporting Platform)',
      },
    })

    if (!response.ok) {
      console.error(`Nominatim API error: ${response.status}`)
      return null
    }

    const data: NominatimResponse = await response.json()

    const result: GeocodingResult = {
      latitude: parseFloat(data.lat),
      longitude: parseFloat(data.lon),
      formattedAddress: data.display_name,
      address: {
        road: data.address.road,
        suburb: data.address.suburb,
        city: data.address.city,
        county: data.address.county,
        state: data.address.state,
        postcode: data.address.postcode,
        country: data.address.country,
      },
    }

    // Cache the result
    if (isRedisAvailable()) {
      await safeSetex(cacheKey, GEOCODING_CACHE_TTL, JSON.stringify(result))
      console.log(`[Geocoding] Cached reverse result for ${latitude},${longitude}`)
    }

    return result
  } catch (error) {
    console.error('Reverse geocoding error:', error)
    return null
  }
}

/**
 * Forward geocode: Convert address string to lat/lng
 * Uses Nominatim (OpenStreetMap) API with Redis caching
 * 
 * @param address - Address string to geocode
 * @param countryCode - Optional country code filter (e.g., 'id' for Indonesia)
 * @returns Geocoding result or null if not found
 */
export async function forwardGeocode(
  address: string,
  countryCode = 'id'
): Promise<GeocodingResult | null> {
  try {
    // Check cache first
    const cacheKey = getForwardGeocodeKey(address, countryCode)
    
    if (isRedisAvailable()) {
      const cached = await safeGet(cacheKey)
      if (cached) {
        console.log(`[Geocoding] Cache hit for forward: ${address}`)
        return JSON.parse(cached)
      }
    }

    // Cache miss - fetch from Nominatim
    console.log(`[Geocoding] Cache miss for forward: ${address}, fetching from API`)
    
    const url = new URL('https://nominatim.openstreetmap.org/search')
    url.searchParams.set('q', address)
    url.searchParams.set('format', 'json')
    url.searchParams.set('addressdetails', '1')
    url.searchParams.set('limit', '1')
    url.searchParams.set('countrycodes', countryCode)
    url.searchParams.set('accept-language', 'id')

    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'Laporin/1.0 (Civic Infrastructure Reporting Platform)',
      },
    })

    if (!response.ok) {
      console.error(`Nominatim API error: ${response.status}`)
      return null
    }

    const data: NominatimResponse[] = await response.json()

    if (data.length === 0) {
      // Cache negative result for 1 hour to avoid repeated failed lookups
      if (isRedisAvailable()) {
        await safeSetex(cacheKey, 60 * 60, JSON.stringify(null))
      }
      return null
    }

    const result: GeocodingResult = {
      latitude: parseFloat(data[0].lat),
      longitude: parseFloat(data[0].lon),
      formattedAddress: data[0].display_name,
      address: {
        road: data[0].address.road,
        suburb: data[0].address.suburb,
        city: data[0].address.city,
        county: data[0].address.county,
        state: data[0].address.state,
        postcode: data[0].address.postcode,
        country: data[0].address.country,
      },
    }

    // Cache the result
    if (isRedisAvailable()) {
      await safeSetex(cacheKey, GEOCODING_CACHE_TTL, JSON.stringify(result))
      console.log(`[Geocoding] Cached forward result for ${address}`)
    }

    return result
  } catch (error) {
    console.error('Forward geocoding error:', error)
    return null
  }
}

/**
 * Validate coordinates are within Indonesia bounds
 * Indonesia approximate bounds: lat -11 to 6, lng 95 to 141
 */
export function isInIndonesia(latitude: number, longitude: number): boolean {
  return (
    latitude >= -11 &&
    latitude <= 6 &&
    longitude >= 95 &&
    longitude <= 141
  )
}
