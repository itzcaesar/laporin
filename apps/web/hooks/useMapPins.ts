// ── hooks/useMapPins.ts ──
// Fetches GeoJSON-compatible map pins

'use client'
import { useState, useEffect } from 'react'
import { api } from '@/lib/api-client'
import type { MapPin, ReportStatus, ApiResponse } from '@/types'

interface UseMapPinsParams {
  status?:     ReportStatus
  categoryId?: number
  gov?:        boolean
}

/**
 * Fetches GeoJSON-compatible map pins. API caches for 30s.
 * Returns empty array while loading — Leaflet handles empty gracefully.
 */
export function useMapPins(params: UseMapPinsParams = {}) {
  const [pins,      setPins]      = useState<MapPin[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const query = new URLSearchParams(
      Object.entries(params)
        .filter(([k, v]) => k !== 'gov' && v != null)
        .map(([k, v]) => [k, String(v)])
    ).toString()

    api.get<ApiResponse<MapPin[]>>(
      `/map/pins${query ? `?${query}` : ''}`,
      { skipAuth: true }
    )
      .then(res => setPins(res.data))
      .catch(() => setPins([]))
      .finally(() => setIsLoading(false))
  }, [])   // intentional: pins refresh on page load only

  return { pins, isLoading }
}
