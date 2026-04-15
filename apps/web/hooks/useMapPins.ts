// ── hooks/useMapPins.ts ──
// Fetches GeoJSON map pins for the map view

"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api-client";

interface MapPin {
  id: string;
  trackingCode: string;
  lat: number;
  lng: number;
  status: string;
  categoryId: number;
  categoryEmoji: string;
  dangerLevel: number;
}

interface GeoFeature {
  properties: Omit<MapPin, "lat" | "lng">;
  geometry: { coordinates: [number, number] };
}

/**
 * Fetches GeoJSON map pins. Cached 30s on the API side.
 */
export function useMapPins() {
  const [pins, setPins] = useState<MapPin[]>([]);
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ data: { features: GeoFeature[] } }>("/map/pins", {
        skipAuth: true,
      })
      .then((res) => {
        const mapped = res.data.features.map((feature) => ({
          ...feature.properties,
          lng: feature.geometry.coordinates[0],
          lat: feature.geometry.coordinates[1],
        }));
        setPins(mapped);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return { pins, isLoading };
}
