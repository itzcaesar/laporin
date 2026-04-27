// Geocoding service using Nominatim (OpenStreetMap)

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
 * Reverse geocode: Convert lat/lng to address
 * Uses Nominatim (OpenStreetMap) API
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

    return {
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
  } catch (error) {
    console.error('Reverse geocoding error:', error)
    return null
  }
}

/**
 * Forward geocode: Convert address string to lat/lng
 * Uses Nominatim (OpenStreetMap) API
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
      return null
    }

    const result = data[0]

    return {
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      formattedAddress: result.display_name,
      address: {
        road: result.address.road,
        suburb: result.address.suburb,
        city: result.address.city,
        county: result.address.county,
        state: result.address.state,
        postcode: result.address.postcode,
        country: result.address.country,
      },
    }
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
