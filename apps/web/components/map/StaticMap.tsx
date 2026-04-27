// ── components/map/StaticMap.tsx ──
"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import L from "leaflet";
import { Loader2 } from "lucide-react";

// Fix Leaflet default marker icon issue with Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface StaticMapProps {
  lat: number;
  lng: number;
  height?: string;
}

export default function StaticMap({ lat, lng, height = "192px" }: StaticMapProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div 
        className="flex items-center justify-center rounded-xl bg-gray-50 border border-border"
        style={{ height }}
      >
        <Loader2 className="h-6 w-6 animate-spin text-blue" />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border" style={{ height }}>
      <MapContainer
        center={[lat, lng]}
        zoom={16}
        style={{ height: "100%", width: "100%" }}
        zoomControl={false}
        dragging={false}
        scrollWheelZoom={false}
        doubleClickZoom={false}
        touchZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[lat, lng]} />
      </MapContainer>
    </div>
  );
}
