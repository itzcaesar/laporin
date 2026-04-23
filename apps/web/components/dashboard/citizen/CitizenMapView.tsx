// ── components/dashboard/citizen/CitizenMapView.tsx ──
"use client";

import "leaflet/dist/leaflet.css";
import { useState, useEffect, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { cn, formatRelativeTime } from "@/lib/utils";
import { getStatusConfig } from "@/lib/status-config";
import { useMapPins } from "@/hooks/useMapPins";
import { FilterChips } from "@/components/dashboard/shared/FilterChips";
import { BottomSheet } from "@/components/dashboard/shared/BottomSheet";
import { Button } from "@/components/ui/Button";
import { Search, Plus, MapPin as MapPinIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ReportStatus } from "@/types";

// ── Marker icon cache ──
const markerIconCache = new Map<ReportStatus, L.DivIcon>();

function createMarkerIcon(status: ReportStatus): L.DivIcon {
  if (markerIconCache.has(status)) {
    return markerIconCache.get(status)!;
  }

  const config = getStatusConfig(status);
  const icon = L.divIcon({
    className: "custom-marker",
    html: `
      <div style="
        width: 32px;
        height: 32px;
        background: ${config.color};
        border: 3px solid white;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="transform: rotate(45deg); font-size: 14px;">
          ${config.emoji}
        </div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });

  markerIconCache.set(status, icon);
  return icon;
}

// ── Fit bounds component ──
function FitBounds({ pins }: { pins: any[] }) {
  const map = useMap();

  useEffect(() => {
    if (pins.length === 0) return;
    const bounds = L.latLngBounds(
      pins.map((p) => [p.lat, p.lng] as [number, number])
    );
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
  }, [map, pins]);

  return null;
}

// ── Filter options ──
const FILTER_OPTIONS = [
  { label: "Semua", value: "all" },
  { label: "Baru", value: "new" },
  { label: "Diverifikasi", value: "verified" },
  { label: "Diproses", value: "in_progress" },
  { label: "Selesai", value: "completed" },
];

export function CitizenMapView() {
  const router = useRouter();
  const { pins, isLoading } = useMapPins();
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPin, setSelectedPin] = useState<any | null>(null);
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);

  // Filter pins
  const filteredPins =
    activeFilter === "all"
      ? pins
      : pins.filter((p) => p.status === activeFilter);

  // Search filter
  const searchedPins = searchQuery
    ? filteredPins.filter((p) =>
        p.trackingCode.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : filteredPins;

  const handlePinClick = (pin: any) => {
    setSelectedPin(pin);
    setIsBottomSheetOpen(true);
  };

  const handleViewDetail = () => {
    if (selectedPin) {
      router.push(`/citizen/reports/${selectedPin.id}`);
    }
  };

  const handleCreateReport = () => {
    router.push("/citizen/reports/new");
  };

  return (
    <div className="relative h-full w-full">
      {/* Search Bar Overlay */}
      <div className="absolute left-4 right-4 top-4 z-[1000] md:left-6 md:right-auto md:w-96">
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            type="search"
            placeholder="Cari kode laporan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-base w-full pl-10 shadow-lg"
          />
        </div>
      </div>

      {/* Filter Chips Overlay */}
      <div className="absolute left-4 right-4 top-20 z-[1000] md:left-6 md:right-auto md:w-96">
        <FilterChips
          options={FILTER_OPTIONS}
          active={activeFilter}
          onChange={setActiveFilter}
          className="bg-white rounded-xl shadow-lg p-2"
        />
      </div>

      {/* Legend */}
      <div className="absolute bottom-24 right-4 z-[1000] rounded-xl bg-white p-3 shadow-lg md:bottom-6">
        <p className="mb-2 font-display text-[10px] font-bold uppercase tracking-wider text-navy">
          Status Laporan
        </p>
        <div className="space-y-1">
          {["new", "verified", "in_progress", "completed"].map((status) => {
            const config = getStatusConfig(status as ReportStatus);
            return (
              <div key={status} className="flex items-center gap-2">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: config.color }}
                />
                <span className="text-[10px] text-muted">{config.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Create Report FAB */}
      <button
        type="button"
        onClick={handleCreateReport}
        className={cn(
          "absolute bottom-24 left-4 z-[1000] md:bottom-6",
          "flex h-14 w-14 items-center justify-center",
          "rounded-full bg-navy text-white shadow-lg",
          "transition-all duration-200 hover:bg-navy/90 hover:scale-105",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2"
        )}
        aria-label="Laporkan di Sini"
      >
        <Plus size={24} />
      </button>

      {/* Map */}
      {isLoading ? (
        <div className="flex h-full w-full items-center justify-center bg-surface">
          <div className="text-center">
            <div className="mb-4 text-4xl">🗺️</div>
            <p className="font-display text-sm font-semibold text-navy">
              Memuat peta...
            </p>
          </div>
        </div>
      ) : (
        <MapContainer
          center={[-6.9175, 107.6191]} // Bandung center
          zoom={13}
          className="h-full w-full"
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />
          <FitBounds pins={searchedPins} />

          {searchedPins.map((pin) => (
            <Marker
              key={pin.id}
              position={[pin.lat, pin.lng]}
              icon={createMarkerIcon(pin.status as ReportStatus)}
              eventHandlers={{
                click: () => handlePinClick(pin),
              }}
            >
              <Popup maxWidth={280}>
                <div className="p-2">
                  <div className="mb-2">
                    <p className="font-display text-sm font-bold text-navy">
                      {pin.trackingCode}
                    </p>
                    <span
                      className={cn(
                        "inline-block rounded-full px-2 py-0.5 text-[10px] font-medium",
                        getStatusConfig(pin.status as ReportStatus).bg
                      )}
                    >
                      {getStatusConfig(pin.status as ReportStatus).label}
                    </span>
                  </div>

                  <button
                    onClick={() => handlePinClick(pin)}
                    className="w-full rounded-lg bg-navy py-1.5 text-center text-xs font-semibold text-white transition-colors hover:bg-navy/90"
                  >
                    Lihat Detail →
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      )}

      {/* Bottom Sheet */}
      <BottomSheet
        isOpen={isBottomSheetOpen}
        onClose={() => setIsBottomSheetOpen(false)}
        snapPoints={[40, 80]}
      >
        {selectedPin && (
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-start gap-3">
              <span className="text-3xl">{selectedPin.categoryEmoji}</span>
              <div className="flex-1">
                <h3 className="font-display text-lg font-bold text-navy">
                  {selectedPin.trackingCode}
                </h3>
                <div
                  className={cn(
                    "mt-1 inline-block rounded-full px-3 py-1 text-xs font-medium",
                    getStatusConfig(selectedPin.status as ReportStatus).bg,
                    "border",
                    getStatusConfig(selectedPin.status as ReportStatus).border
                  )}
                  style={{
                    color: getStatusConfig(selectedPin.status as ReportStatus)
                      .textColor,
                  }}
                >
                  {getStatusConfig(selectedPin.status as ReportStatus).emoji}{" "}
                  {getStatusConfig(selectedPin.status as ReportStatus).label}
                </div>
              </div>
            </div>

            {/* Danger Level */}
            {selectedPin.dangerLevel && (
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-3">
                <p className="text-xs font-medium text-amber-800">
                  ⚠️ Tingkat Bahaya: {selectedPin.dangerLevel}/5
                </p>
              </div>
            )}

            {/* Location */}
            <div className="flex items-start gap-2">
              <MapPinIcon size={16} className="mt-0.5 text-muted" />
              <div>
                <p className="text-xs font-medium text-muted">Lokasi</p>
                <p className="text-sm font-body text-ink">
                  {selectedPin.lat.toFixed(6)}, {selectedPin.lng.toFixed(6)}
                </p>
              </div>
            </div>

            {/* Action Button */}
            <Button
              variant="primary"
              onClick={handleViewDetail}
              className="w-full"
            >
              Lihat Detail Lengkap →
            </Button>
          </div>
        )}
      </BottomSheet>
    </div>
  );
}
