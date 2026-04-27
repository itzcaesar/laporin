// ── components/dashboard/gov/RiskZoneMap.tsx ──
// Leaflet heatmap for risk zone visualization on analytics page
"use client";

import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";
import { api } from "@/lib/api-client";
import { Loader2 } from "lucide-react";

// ── Heatmap Layer Component ──
function HeatmapLayer({ data }: { data: number[][] }) {
  const map = useMap();
  const heatLayerRef = useRef<any>(null);

  useEffect(() => {
    if (!data || data.length === 0) return;

    // Remove existing layer
    if (heatLayerRef.current) {
      map.removeLayer(heatLayerRef.current);
    }

    // Create heatmap layer
    // @ts-ignore — leaflet.heat adds L.heatLayer
    const heat = L.heatLayer(data, {
      radius: 25,
      blur: 15,
      maxZoom: 17,
      max: 1.0,
      gradient: {
        0.0: "#00ff00",
        0.4: "#ffff00",
        0.6: "#ffa500",
        0.8: "#ff4500",
        1.0: "#ff0000",
      },
    });

    heat.addTo(map);
    heatLayerRef.current = heat;

    // Fit bounds to data if available
    if (data.length > 0) {
      const lats = data.map((d) => d[0]);
      const lngs = data.map((d) => d[1]);
      const bounds = L.latLngBounds(
        [Math.min(...lats), Math.min(...lngs)],
        [Math.max(...lats), Math.max(...lngs)]
      );
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }

    return () => {
      if (heatLayerRef.current) {
        map.removeLayer(heatLayerRef.current);
      }
    };
  }, [data, map]);

  return null;
}

// ── Main Component ──
export default function RiskZoneMap() {
  const [heatmapData, setHeatmapData] = useState<number[][]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchHeatmap() {
      try {
        setIsLoading(true);
        const res = await api.get<{ success: true; data: number[][] }>(
          "/gov/dashboard/heatmap"
        );
        setHeatmapData(res.data);
      } catch (err: any) {
        setError(err.message || "Gagal memuat data heatmap");
      } finally {
        setIsLoading(false);
      }
    }
    fetchHeatmap();
  }, []);

  if (isLoading) {
    return (
      <div className="rounded-xl bg-surface h-[400px] flex flex-col items-center justify-center text-muted border border-border">
        <Loader2 className="h-8 w-8 animate-spin text-blue mb-3" />
        <p className="text-sm">Memuat peta heatmap...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl bg-red-50 h-[400px] flex flex-col items-center justify-center text-red-600 border border-red-200">
        <p className="text-sm font-medium mb-1">Gagal memuat heatmap</p>
        <p className="text-xs text-red-500">{error}</p>
      </div>
    );
  }

  if (heatmapData.length === 0) {
    return (
      <div className="rounded-xl bg-surface h-[400px] flex flex-col items-center justify-center text-muted border border-border">
        <svg
          className="w-12 h-12 mb-3 text-muted/40"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
          />
        </svg>
        <p className="text-sm">Belum ada data laporan untuk ditampilkan</p>
      </div>
    );
  }

  // Default center: Indonesia (Bandung area)
  const defaultCenter: [number, number] = [-6.9175, 107.6191];

  return (
    <div className="relative rounded-xl overflow-hidden border border-border h-[400px]">
      <MapContainer
        center={defaultCenter}
        zoom={12}
        style={{ height: "100%", width: "100%" }}
        zoomControl={true}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <HeatmapLayer data={heatmapData} />
      </MapContainer>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-md border border-border">
        <p className="text-[10px] font-bold text-navy mb-2 uppercase tracking-wider">
          Kepadatan Laporan
        </p>
        <div className="flex items-center gap-1">
          <div
            className="h-2 w-20 rounded-full"
            style={{
              background:
                "linear-gradient(to right, #00ff00, #ffff00, #ffa500, #ff4500, #ff0000)",
            }}
          />
        </div>
        <div className="flex justify-between text-[9px] text-muted mt-0.5">
          <span>Rendah</span>
          <span>Tinggi</span>
        </div>
      </div>
    </div>
  );
}
