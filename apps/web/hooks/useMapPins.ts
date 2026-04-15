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
  categoryName: string;
  dangerLevel: number;
}

interface GeoFeature {
  id: string;
  properties: {
    trackingCode: string;
    status: string;
    categoryId: number;
    categoryEmoji: string;
    categoryName: string;
    dangerLevel: number;
  };
  geometry: { coordinates: [number, number] };
}

interface GeoJSONResponse {
  type: string;
  features: GeoFeature[];
}

// Mock data for development when API is unavailable
const MOCK_PINS: MapPin[] = [
  {
    id: "1",
    trackingCode: "LP-2026-BDG-00001",
    lat: -6.9175,
    lng: 107.6191,
    status: "new",
    categoryId: 1,
    categoryEmoji: "🛣",
    categoryName: "Jalan Rusak",
    dangerLevel: 3,
  },
  {
    id: "2",
    trackingCode: "LP-2026-BDG-00002",
    lat: -6.9147,
    lng: 107.6098,
    status: "in_progress",
    categoryId: 2,
    categoryEmoji: "🌊",
    categoryName: "Drainase Tersumbat",
    dangerLevel: 2,
  },
  {
    id: "3",
    trackingCode: "LP-2026-BDG-00003",
    lat: -6.9025,
    lng: 107.6186,
    status: "completed",
    categoryId: 3,
    categoryEmoji: "🚦",
    categoryName: "Lampu Lalu Lintas",
    dangerLevel: 4,
  },
  {
    id: "4",
    trackingCode: "LP-2026-BDG-00004",
    lat: -6.9344,
    lng: 107.6069,
    status: "verified",
    categoryId: 4,
    categoryEmoji: "🌉",
    categoryName: "Jembatan Rusak",
    dangerLevel: 5,
  },
];

/**
 * Fetches GeoJSON map pins. Cached 30s on the API side.
 * Falls back to mock data if API is unavailable.
 */
export function useMapPins() {
  const [pins, setPins] = useState<MapPin[]>([]);
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<GeoJSONResponse>("/map/pins", {
        skipAuth: true,
      })
      .then((res) => {
        // API returns GeoJSON directly (not nested in data)
        const features = res.features || [];
        const mapped = features.map((feature) => ({
          id: feature.id,
          ...feature.properties,
          lng: feature.geometry.coordinates[0],
          lat: feature.geometry.coordinates[1],
        }));
        setPins(mapped.length > 0 ? mapped : MOCK_PINS);
      })
      .catch((err) => {
        console.error("Error fetching map pins:", err);
        console.log("Using mock data for development");
        setPins(MOCK_PINS); // Use mock data on error
      })
      .finally(() => setLoading(false));
  }, []);

  return { pins, isLoading };
}


