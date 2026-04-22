// ── app/gov/map/page.tsx ──
"use client";

import "leaflet/dist/leaflet.css";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Layers, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

// Dynamic import for Leaflet (SSR-safe)
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import("react-leaflet").then((mod) => mod.Popup),
  { ssr: false }
);

type MapPin = {
  id: string;
  lat: number;
  lng: number;
  trackingCode: string;
  categoryEmoji: string;
  categoryName: string;
  status: string;
  locationAddress: string;
};

// Mock data - replace with API call
const MOCK_PINS: MapPin[] = [
  {
    id: "1",
    lat: -6.9175,
    lng: 107.6191,
    trackingCode: "LP-2026-BDG-00142",
    categoryEmoji: "🛣",
    categoryName: "Jalan Rusak",
    status: "Diproses",
    locationAddress: "Jl. Sudirman No.12",
  },
  {
    id: "2",
    lat: -6.9147,
    lng: 107.6098,
    trackingCode: "LP-2026-BDG-00141",
    categoryEmoji: "🌊",
    categoryName: "Drainase",
    status: "Baru",
    locationAddress: "Jl. Asia Afrika No.45",
  },
  {
    id: "3",
    lat: -6.9025,
    lng: 107.6186,
    trackingCode: "LP-2026-BDG-00140",
    categoryEmoji: "🚦",
    categoryName: "Lampu Lalu Lintas",
    status: "Diverifikasi",
    locationAddress: "Jl. Dago No.88",
  },
];

export default function GovMapPage() {
  const [pins, setPins] = useState<MapPin[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [layers, setLayers] = useState({
    reportPins: true,
    heatmap: false,
    jurisdictionBoundaries: false,
    predictedRiskZones: false,
  });
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState("30");

  // Ensure client-side only rendering
  useEffect(() => {
    setIsClient(true);
    setPins(MOCK_PINS);
  }, []);

  const toggleLayer = (layer: keyof typeof layers) => {
    setLayers((prev) => ({ ...prev, [layer]: !prev[layer] }));
  };

  // Filter pins
  const filteredPins = pins.filter((pin) => {
    if (categoryFilter !== "all" && pin.categoryName !== categoryFilter) {
      return false;
    }
    if (statusFilter !== "all" && pin.status !== statusFilter) {
      return false;
    }
    return true;
  });

  if (!isClient) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center bg-surface">
        <div className="text-sm text-muted">Memuat peta...</div>
      </div>
    );
  }

  return (
    <div className="relative h-[calc(100vh-4rem)] bg-surface">
      {/* Map Container */}
      <MapContainer
        center={[-6.9175, 107.6191]}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Report Pins */}
        {layers.reportPins &&
          filteredPins.map((pin) => (
            <Marker key={pin.id} position={[pin.lat, pin.lng]}>
              <Popup>
                <div className="p-2 min-w-[200px]">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{pin.categoryEmoji}</span>
                    <div>
                      <div className="font-mono text-xs text-blue font-semibold">
                        {pin.trackingCode}
                      </div>
                      <div className="text-xs text-muted">{pin.categoryName}</div>
                    </div>
                  </div>
                  <div className="text-xs text-ink mb-2">
                    {pin.locationAddress}
                  </div>
                  <div className="text-xs text-muted mb-3">
                    Status: {pin.status}
                  </div>
                  <div className="flex gap-2">
                    <a
                      href={`/gov/reports/${pin.id}`}
                      className="flex-1 rounded-lg bg-blue px-3 py-1.5 text-xs font-medium text-white text-center hover:bg-blue/90 transition-colors"
                    >
                      Lihat Detail →
                    </a>
                    <button
                      type="button"
                      className="flex-1 rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-medium text-ink hover:bg-surface transition-colors"
                    >
                      Tugaskan PIC
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
      </MapContainer>

      {/* Top-Left Control Panel */}
      <div className="absolute left-4 top-4 z-[1000] w-72 rounded-2xl bg-white p-4 shadow-lg border border-border">
        <h3 className="text-sm font-semibold font-display text-navy mb-3 flex items-center gap-2">
          <Layers size={16} />
          Layer & Filter
        </h3>

        {/* Layer Toggles */}
        <div className="space-y-2 mb-4 pb-4 border-b border-border">
          <label className="flex items-center gap-2 text-sm text-ink cursor-pointer">
            <input
              type="checkbox"
              checked={layers.reportPins}
              onChange={() => toggleLayer("reportPins")}
              className="h-4 w-4 rounded border-gray-300 text-blue focus:ring-blue"
            />
            Report Pins
          </label>
          <label className="flex items-center gap-2 text-sm text-ink cursor-pointer">
            <input
              type="checkbox"
              checked={layers.heatmap}
              onChange={() => toggleLayer("heatmap")}
              className="h-4 w-4 rounded border-gray-300 text-blue focus:ring-blue"
            />
            Heatmap Overlay
          </label>
          <label className="flex items-center gap-2 text-sm text-ink cursor-pointer">
            <input
              type="checkbox"
              checked={layers.jurisdictionBoundaries}
              onChange={() => toggleLayer("jurisdictionBoundaries")}
              className="h-4 w-4 rounded border-gray-300 text-blue focus:ring-blue"
            />
            Jurisdiction Boundaries
          </label>
          <label className="flex items-center gap-2 text-sm text-ink cursor-pointer">
            <input
              type="checkbox"
              checked={layers.predictedRiskZones}
              onChange={() => toggleLayer("predictedRiskZones")}
              className="h-4 w-4 rounded border-gray-300 text-blue focus:ring-blue"
            />
            Predicted Risk Zones (AI)
          </label>
        </div>

        {/* Filters */}
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-muted mb-1">
              Kategori
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-ink focus:border-blue focus:outline-none focus:ring-2 focus:ring-blue/20"
            >
              <option value="all">Semua Kategori</option>
              <option value="Jalan Rusak">Jalan Rusak</option>
              <option value="Drainase">Drainase</option>
              <option value="Lampu Lalu Lintas">Lampu Lalu Lintas</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted mb-1">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-ink focus:border-blue focus:outline-none focus:ring-2 focus:ring-blue/20"
            >
              <option value="all">Semua Status</option>
              <option value="Baru">Baru</option>
              <option value="Diverifikasi">Diverifikasi</option>
              <option value="Diproses">Diproses</option>
              <option value="Selesai">Selesai</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted mb-1">
              Rentang Waktu
            </label>
            <div className="flex items-center gap-1 rounded-lg border border-border bg-white p-1">
              {["7", "30", "90"].map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => setDateRange(days)}
                  className={cn(
                    "flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
                    dateRange === days
                      ? "bg-navy text-white"
                      : "text-ink hover:bg-surface"
                  )}
                >
                  {days} hari
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Top-Right Stats Card */}
      <div className="absolute right-4 top-4 z-[1000] rounded-2xl bg-white p-4 shadow-lg border border-border">
        <div className="text-center">
          <div className="text-2xl font-bold font-display text-navy mb-1">
            {filteredPins.length}
          </div>
          <div className="text-xs text-muted">laporan terlihat</div>
        </div>
      </div>

      {/* Note about heatmap implementation */}
      {(layers.heatmap || layers.predictedRiskZones) && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000] rounded-xl bg-teal-light border-l-4 border-teal p-3 shadow-lg max-w-md">
          <p className="text-xs text-teal-900">
            🤖 Heatmap dan predicted risk zones akan diimplementasikan dengan
            leaflet.heat plugin di backend integration phase
          </p>
        </div>
      )}
    </div>
  );
}

