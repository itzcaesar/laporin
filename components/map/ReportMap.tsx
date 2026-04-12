// ── components/map/ReportMap.tsx ──
"use client";

import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import { cn } from "@/lib/utils";
import { MOCK_REPORTS, STATUS_CONFIG } from "@/data/mock-reports";
import type { MockReport, ReportStatusMap } from "@/types/report";

// ── Custom marker icon factory ──
function createMarkerIcon(status: ReportStatusMap): L.DivIcon {
  const config = STATUS_CONFIG[status];
  return L.divIcon({
    className: "custom-marker",
    html: `
      <div style="
        width: 32px;
        height: 32px;
        background: ${config.markerColor};
        border: 3px solid white;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="transform: rotate(45deg); font-size: 12px; color: white; font-weight: bold;">
          ●
        </div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
}

// ── Fit bounds component ──
function FitBounds({ reports }: { reports: MockReport[] }) {
  const map = useMap();
  useEffect(() => {
    if (reports.length === 0) return;
    const bounds = L.latLngBounds(
      reports.map((r) => [r.lat, r.lng] as [number, number])
    );
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    return () => {};
  }, [map, reports]);
  return null;
}

// ── Status filter type ──
type FilterStatus = "semua" | ReportStatusMap;
type MobileView = "map" | "list";

const FILTER_OPTIONS: { value: FilterStatus; label: string; emoji: string }[] = [
  { value: "semua", label: "Semua", emoji: "📋" },
  { value: "baru", label: "Baru", emoji: "🟡" },
  { value: "diverifikasi", label: "Diverifikasi", emoji: "🔵" },
  { value: "diproses", label: "Diproses", emoji: "🟠" },
  { value: "selesai", label: "Selesai", emoji: "🟢" },
  { value: "terverifikasi", label: "Terverifikasi", emoji: "✅" },
] as const;

// ── Report card in sidebar ──
function ReportCard({
  report,
  isSelected,
  onClick,
}: {
  report: MockReport;
  isSelected: boolean;
  onClick: () => void;
}) {
  const statusCfg = STATUS_CONFIG[report.status];

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full rounded-xl border p-4 text-left transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue",
        "hover:shadow-md",
        isSelected
          ? "border-blue bg-blue-light/50 shadow-md"
          : "border-gray-100 bg-white hover:border-gray-200"
      )}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{report.categoryEmoji}</span>
          <h3 className="font-display text-sm font-bold text-navy line-clamp-1">
            {report.title}
          </h3>
        </div>
        <span
          className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold"
          style={{
            backgroundColor: statusCfg.bg,
            color: statusCfg.color,
            border: `1px solid ${statusCfg.border}`,
          }}
        >
          {statusCfg.label}
        </span>
      </div>

      <p className="mb-2 text-xs leading-relaxed text-muted line-clamp-2">
        {report.description}
      </p>

      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted">{report.location}</span>
        <div className="flex items-center gap-2 text-[10px] text-muted">
          <span>👍 {report.upvotes}</span>
          <span>💬 {report.comments}</span>
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between border-t border-gray-50 pt-2">
        <span className="text-[10px] text-muted">
          📍 {report.reportedAt}
        </span>
        {report.pic && (
          <span className="text-[10px] font-medium text-teal">
            PIC: {report.pic.split(",")[0]}
          </span>
        )}
      </div>
    </button>
  );
}

// ── Skeleton card for loading state ──
function SkeletonCard() {
  return (
    <div className="w-full animate-pulse rounded-xl border border-gray-100 p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-md bg-gray-200" />
          <div className="h-4 w-32 rounded bg-gray-200" />
        </div>
        <div className="h-5 w-16 rounded-full bg-gray-200" />
      </div>
      <div className="mb-2 space-y-1.5">
        <div className="h-3 w-full rounded bg-gray-100" />
        <div className="h-3 w-3/4 rounded bg-gray-100" />
      </div>
      <div className="flex justify-between">
        <div className="h-3 w-40 rounded bg-gray-100" />
        <div className="h-3 w-16 rounded bg-gray-100" />
      </div>
    </div>
  );
}

// ── The Leaflet map portion (extracted for clarity) ──
function MapView({
  filteredReports,
  onReportClick,
}: {
  filteredReports: readonly MockReport[] | MockReport[];
  onReportClick: (id: string) => void;
}) {
  return (
    <MapContainer
      center={[-6.9740, 107.6310]}
      zoom={15}
      className="h-full w-full"
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />
      <FitBounds reports={filteredReports as unknown as MockReport[]} />

      {filteredReports.map((report) => (
        <Marker
          key={report.id}
          position={[report.lat, report.lng]}
          icon={createMarkerIcon(report.status)}
          eventHandlers={{
            click: () => onReportClick(report.id),
          }}
        >
          <Popup maxWidth={280} className="report-popup">
            <div className="p-1">
              <div className="mb-2 flex items-center gap-2">
                <span className="text-xl">{report.categoryEmoji}</span>
                <div>
                  <h3 className="font-display text-sm font-bold text-navy">
                    {report.title}
                  </h3>
                  <span className="text-[10px] text-muted">
                    {report.category}
                  </span>
                </div>
              </div>

              <p className="mb-2 text-xs leading-relaxed text-ink">
                {report.description}
              </p>

              <div className="mb-2 flex items-center gap-1 text-[10px] text-muted">
                📍 {report.location}
              </div>

              <div className="flex items-center justify-between border-t border-gray-100 pt-2">
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                  style={{
                    backgroundColor: STATUS_CONFIG[report.status].bg,
                    color: STATUS_CONFIG[report.status].color,
                  }}
                >
                  {STATUS_CONFIG[report.status].label}
                </span>
                <div className="flex gap-2 text-[10px] text-muted">
                  <span>👍 {report.upvotes}</span>
                  <span>💬 {report.comments}</span>
                </div>
              </div>

              {report.pic && (
                <div className="mt-2 rounded-lg bg-teal-light/50 px-2 py-1 text-[10px] text-teal">
                  PIC: {report.pic}
                </div>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

// ── Main map component ──
export function ReportMap() {
  const [activeFilter, setActiveFilter] = useState<FilterStatus>("semua");
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [mobileView, setMobileView] = useState<MobileView>("map");
  const [isLoading, setIsLoading] = useState(true);

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const filteredReports =
    activeFilter === "semua"
      ? MOCK_REPORTS
      : MOCK_REPORTS.filter((r) => r.status === activeFilter);

  const handleFilterChange = (filter: FilterStatus) => {
    setActiveFilter(filter);
    setSelectedReport(null);
  };

  const handleReportClick = (reportId: string) => {
    setSelectedReport(reportId);
    // On mobile, switch to map view when a report is clicked from list
    setMobileView("map");
  };

  const handleToggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  // Count by status
  const statusCounts = MOCK_REPORTS.reduce(
    (acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="flex h-full w-full flex-col md:flex-row">
      {/* ═══ Mobile Tab Switcher ═══ */}
      <div className="flex shrink-0 border-b border-gray-100 bg-white md:hidden">
        <button
          type="button"
          onClick={() => setMobileView("map")}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 py-3 font-display text-sm font-semibold",
            "min-h-[44px] transition-colors duration-200",
            mobileView === "map"
              ? "border-b-2 border-navy text-navy"
              : "text-muted"
          )}
        >
          🗺️ Peta
        </button>
        <button
          type="button"
          onClick={() => setMobileView("list")}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 py-3 font-display text-sm font-semibold",
            "min-h-[44px] transition-colors duration-200",
            mobileView === "list"
              ? "border-b-2 border-navy text-navy"
              : "text-muted"
          )}
        >
          📋 Daftar ({filteredReports.length})
        </button>
      </div>

      {/* ═══ Mobile: Filter bar (always visible) ═══ */}
      <div className="shrink-0 overflow-x-auto border-b border-gray-100 bg-white px-3 py-2 md:hidden">
        <div className="flex gap-1.5">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleFilterChange(opt.value)}
              className={cn(
                "flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold",
                "min-h-[32px] transition-all duration-200",
                activeFilter === opt.value
                  ? "bg-navy text-white"
                  : "bg-gray-50 text-muted"
              )}
            >
              <span>{opt.emoji}</span>
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ═══ Desktop Sidebar ═══ */}
      <div
        className={cn(
          "hidden h-full flex-col border-r border-gray-100 bg-white transition-all duration-300 md:flex",
          isSidebarOpen ? "w-[380px]" : "w-0 overflow-hidden"
        )}
      >
        {/* Sidebar header */}
        <div className="shrink-0 border-b border-gray-100 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-navy">
              Peta Laporan
            </h2>
            <span className="rounded-full bg-blue-light px-3 py-1 font-display text-xs font-bold text-blue">
              {filteredReports.length} laporan
            </span>
          </div>

          {/* Status filter pills */}
          <div className="flex flex-wrap gap-1.5">
            {FILTER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleFilterChange(opt.value)}
                className={cn(
                  "flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold",
                  "min-h-[32px] transition-all duration-200",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue",
                  activeFilter === opt.value
                    ? "bg-navy text-white"
                    : "bg-gray-50 text-muted hover:bg-gray-100 hover:text-navy"
                )}
              >
                <span>{opt.emoji}</span>
                <span>{opt.label}</span>
                {opt.value !== "semua" && statusCounts[opt.value] && (
                  <span className="ml-0.5 rounded-full bg-white/20 px-1.5 text-[10px]">
                    {statusCounts[opt.value]}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Report list */}
        <div className="flex-1 space-y-2 overflow-y-auto p-3">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))
            : filteredReports.map((report) => (
                <ReportCard
                  key={report.id}
                  report={report as MockReport}
                  isSelected={selectedReport === report.id}
                  onClick={() => handleReportClick(report.id)}
                />
              ))}
          {!isLoading && filteredReports.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-2xl">📭</p>
              <p className="mt-2 font-display text-sm font-semibold text-navy">
                Tidak ada laporan
              </p>
              <p className="mt-1 text-xs text-muted">
                Tidak ada laporan dengan status ini.
              </p>
            </div>
          )}
        </div>

        {/* Sidebar footer stats */}
        <div className="shrink-0 border-t border-gray-100 bg-gray-50 px-4 py-3">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-muted">Area: Buah Batu / Dayeuh Kolot, Bandung</span>
            <span className="font-semibold text-navy">
              {MOCK_REPORTS.length} total laporan
            </span>
          </div>
        </div>
      </div>

      {/* ═══ Mobile List View ═══ */}
      <div
        className={cn(
          "flex-1 overflow-y-auto bg-surface p-3 md:hidden",
          mobileView === "list" ? "block" : "hidden"
        )}
      >
        <div className="space-y-2">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))
            : filteredReports.map((report) => (
                <ReportCard
                  key={report.id}
                  report={report as MockReport}
                  isSelected={selectedReport === report.id}
                  onClick={() => handleReportClick(report.id)}
                />
              ))}
        </div>
      </div>

      {/* ═══ Map View (desktop: always visible, mobile: toggled via opacity to preserve Leaflet size) ═══ */}
      <div
        className={cn(
          "relative h-full w-full flex-1",
          mobileView === "list" ? "max-md:absolute max-md:inset-0 max-md:opacity-0 max-md:pointer-events-none z-0" : "z-10"
        )}
      >
        {/* Desktop toggle sidebar button */}
        <button
          type="button"
          onClick={handleToggleSidebar}
          className={cn(
            "absolute left-3 top-3 z-[1000] hidden h-10 w-10 items-center justify-center md:flex",
            "rounded-xl bg-white text-navy shadow-lg",
            "transition-all duration-200 hover:bg-gray-50",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue",
            "min-h-[44px] min-w-[44px]"
          )}
          aria-label={isSidebarOpen ? "Tutup panel" : "Buka panel"}
        >
          {isSidebarOpen ? "◀" : "▶"}
        </button>

        {/* Legend */}
        <div className="absolute bottom-6 right-3 z-[1000] rounded-xl bg-white p-3 shadow-lg">
          <p className="mb-2 font-display text-[10px] font-bold uppercase tracking-wider text-navy">
            Status Laporan
          </p>
          <div className="space-y-1">
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
              <div key={key} className="flex items-center gap-2">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: cfg.markerColor }}
                />
                <span className="text-[10px] text-muted">{cfg.label}</span>
              </div>
            ))}
          </div>
        </div>

        <MapView
          filteredReports={filteredReports}
          onReportClick={handleReportClick}
        />
      </div>
    </div>
  );
}
