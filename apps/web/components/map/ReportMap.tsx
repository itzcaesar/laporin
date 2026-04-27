// ── components/map/ReportMap.tsx ──
"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useState, useMemo, memo, useCallback } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import { cn } from "@/lib/utils";
import { STATUS_CONFIG, getStatusConfig } from "@/lib/status-config";
import { useReports } from "@/hooks/useReports";
import { ReportDetailModal } from "@/components/map/ReportDetailModal";
import { ThumbsUp, MessageCircle } from "lucide-react";
import type { ReportStatus } from '@laporin/types'
import type { Report } from '@laporin/types';

// ── Marker icon cache for performance ──
const markerIconCache = new Map<ReportStatus, L.DivIcon>();

// ── Status marker colors ──
const STATUS_MARKER_COLORS: Record<ReportStatus, string> = {
  new: "#F59E0B",
  verified: "#3B82F6",
  in_progress: "#F97316",
  completed: "#10B981",
  verified_complete: "#059669",
  rejected: "#EF4444",
  disputed: "#F43F5E",
  closed: "#6B7280",
};

// ── Custom marker icon factory (cached) ──
function createMarkerIcon(status: ReportStatus): L.DivIcon {
  if (markerIconCache.has(status)) {
    return markerIconCache.get(status)!;
  }

  const markerColor = STATUS_MARKER_COLORS[status] ?? "#6B7280";
  const icon = L.divIcon({
    className: "custom-marker",
    html: `
      <div style="
        width: 32px;
        height: 32px;
        background: ${markerColor};
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

  markerIconCache.set(status, icon);
  return icon;
}

// ── Fit bounds component (memoized) ──
const FitBounds = memo(function FitBounds({ reports }: { reports: Report[] }) {
  const map = useMap();
  
  useEffect(() => {
    if (reports.length === 0) return;
    const validReports = reports.filter(
      (r) => r.locationLat != null && r.locationLng != null
    );
    if (validReports.length === 0) return;
    const bounds = L.latLngBounds(
      validReports.map((r) => [r.locationLat!, r.locationLng!] as [number, number])
    );
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
  }, [map, reports]);
  
  return null;
});

// ── Status filter type ──
type FilterStatus = "all" | ReportStatus;
type MobileView = "map" | "list";

const FILTER_OPTIONS: { value: FilterStatus; label: string; emoji: string }[] = [
  { value: "all", label: "Semua", emoji: "📋" },
  { value: "new", label: "Baru", emoji: "🟡" },
  { value: "verified", label: "Diverifikasi", emoji: "🔵" },
  { value: "in_progress", label: "Diproses", emoji: "🟠" },
  { value: "completed", label: "Selesai", emoji: "🟢" },
  { value: "verified_complete", label: "Terverifikasi", emoji: "✅" },
] as const;

// ── Report card in sidebar (memoized) ──
const ReportCard = memo(function ReportCard({
  report,
  isSelected,
  onClick,
}: {
  report: Report;
  isSelected: boolean;
  onClick: () => void;
}) {
  const statusCfg = getStatusConfig(report.status);

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
          <span className="text-lg">{report.categoryEmoji ?? "📋"}</span>
          <h3 className="font-display text-sm font-bold text-navy line-clamp-1">
            {report.title}
          </h3>
        </div>
        <span
          className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold"
          style={{
            backgroundColor: statusCfg.color,
            color: statusCfg.textColor,
            border: `1px solid ${statusCfg.color}`,
          }}
        >
          {statusCfg.label}
        </span>
      </div>

      {report.description && (
        <p className="mb-2 text-xs leading-relaxed text-muted line-clamp-2">
          {report.description}
        </p>
      )}

      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted line-clamp-1 max-w-[200px]">{report.locationAddress}</span>
        <div className="flex items-center gap-2 text-[10px] text-muted">
          <span className="flex items-center gap-0.5">
            <ThumbsUp size={9} /> {report.upvoteCount}
          </span>
          <span className="flex items-center gap-0.5">
            <MessageCircle size={9} /> {report.commentCount}
          </span>
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between border-t border-gray-50 pt-2">
        <span className="text-[10px] text-muted">
          📍 {new Date(report.createdAt).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </span>
        {report.picName && (
          <span className="text-[10px] font-medium text-teal">
            PIC: {report.picName.split(",")[0]}
          </span>
        )}
      </div>
    </button>
  );
});

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

// ── Empty state for no reports ──
function EmptyState({ hasFilter }: { hasFilter: boolean }) {
  return (
    <div className="py-12 text-center">
      <p className="text-2xl">{hasFilter ? "📭" : "🗺️"}</p>
      <p className="mt-2 font-display text-sm font-semibold text-navy">
        {hasFilter ? "Tidak ada laporan" : "Belum ada laporan"}
      </p>
      <p className="mt-1 text-xs text-muted">
        {hasFilter
          ? "Tidak ada laporan dengan status ini."
          : "Belum ada laporan infrastruktur yang dibuat."}
      </p>
    </div>
  );
}

// ── Error state ──
function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="py-12 text-center">
      <p className="text-2xl">⚠️</p>
      <p className="mt-2 font-display text-sm font-semibold text-navy">
        Gagal memuat laporan
      </p>
      <p className="mt-1 text-xs text-muted">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-3 rounded-lg bg-navy px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-navy/90"
      >
        Coba Lagi
      </button>
    </div>
  );
}

// ── The Leaflet map portion (extracted for clarity) ──
function MapView({
  reports,
  onReportClick,
}: {
  reports: Report[];
  onReportClick: (id: string) => void;
}) {
  const validReports = useMemo(
    () => reports.filter((r) => r.locationLat != null && r.locationLng != null),
    [reports]
  );

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
      <FitBounds reports={validReports} />

      {validReports.map((report) => {
        const statusCfg = getStatusConfig(report.status);
        return (
          <Marker
            key={report.id}
            position={[report.locationLat!, report.locationLng!]}
            icon={createMarkerIcon(report.status)}
          >
            <Popup maxWidth={280} className="report-popup">
              <div className="p-1 pt-2">
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-xl">{report.categoryEmoji ?? "📋"}</span>
                  <div>
                    <h3 className="font-display text-sm font-bold text-navy line-clamp-1">
                      {report.title}
                    </h3>
                    <span className="text-[10px] text-muted">
                      {report.categoryName ?? "Kategori"}
                    </span>
                  </div>
                </div>

                {report.description && (
                  <p className="mb-2 text-xs leading-relaxed text-ink line-clamp-2">
                    {report.description}
                  </p>
                )}

                <div className="mb-2 flex items-center gap-1 text-[10px] text-muted">
                  📍 {report.locationAddress}
                </div>

                {/* Status & Priority */}
                <div className="mb-2 flex flex-wrap items-center gap-1.5">
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                    style={{
                      backgroundColor: statusCfg.color,
                      color: statusCfg.textColor,
                    }}
                  >
                    {statusCfg.label}
                  </span>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-bold border",
                      report.priority === "urgent" || report.priority === "high"
                        ? "border-red-200 bg-red-50 text-red-600"
                        : "border-gray-200 bg-gray-50 text-gray-600"
                    )}
                  >
                    {report.priority === "urgent" ? "🚨 " : ""}
                    {report.priority === "urgent"
                      ? "Kritis"
                      : report.priority === "high"
                        ? "Tinggi"
                        : report.priority === "medium"
                          ? "Sedang"
                          : "Rendah"}
                  </span>
                </div>

                {/* Upvote & Comment info */}
                <div className="mb-3 flex items-center gap-2 border-y border-gray-100 py-2">
                  <div className="flex items-center gap-1.5 rounded-md bg-blue-50 px-2 py-1 text-[11px] font-bold text-blue">
                    <ThumbsUp size={12} className="fill-blue" />
                    <span>{report.upvoteCount}</span>
                  </div>
                  <div className="ml-auto text-[10px] text-muted">
                    💬 {report.commentCount} Komentar
                  </div>
                </div>

                {report.picName && (
                  <div className="mb-3 rounded-lg bg-teal-light/50 px-2 py-1 text-[10px] text-teal">
                    PIC: {report.picName}
                  </div>
                )}

                <button
                  className="w-full rounded-lg bg-navy py-1.5 text-center text-[11px] font-semibold text-white transition-colors hover:bg-navy/90"
                  onClick={() => onReportClick(report.id)}
                >
                  Lihat Detail →
                </button>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}

// ── Main map component ──
export function ReportMap() {
  const [activeFilter, setActiveFilter] = useState<FilterStatus>("all");
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [mobileView, setMobileView] = useState<MobileView>("map");
  const [detailReportId, setDetailReportId] = useState<string | null>(null);

  // Fetch reports from API with status filter
  const { reports, meta, isLoading, error, refetch } = useReports({
    status: activeFilter === "all" ? undefined : activeFilter,
    limit: 100, // Load more reports for the map view
    sortBy: "createdAt",
    sortDir: "desc",
  });

  const handleFilterChange = (filter: FilterStatus) => {
    setActiveFilter(filter);
    setSelectedReport(null);
  };

  const handleReportClick = (reportId: string) => {
    setSelectedReport(reportId);
    setMobileView("map");
  };

  const handleReportDetailOpen = (reportId: string) => {
    setDetailReportId(reportId);
  };

  const handleToggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  // Count by status from loaded reports
  const statusCounts = useMemo(() => {
    return reports.reduce(
      (acc, r) => {
        acc[r.status] = (acc[r.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
  }, [reports]);

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
          📋 Daftar ({reports.length})
        </button>
      </div>

      {/* ═══ Mobile: Filter bar (always visible) ═══ */}
      <div className="shrink-0 border-b border-gray-100 bg-white px-3 py-2 md:hidden">
        <div className="grid grid-cols-3 gap-1.5 w-full">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleFilterChange(opt.value)}
              className={cn(
                "flex items-center w-full justify-center gap-1 rounded-lg px-1 py-1.5 text-[10px] font-semibold sm:text-[11px]",
                "min-h-[32px] transition-all duration-200",
                activeFilter === opt.value
                  ? "bg-navy text-white"
                  : "bg-gray-50 text-muted"
              )}
            >
              <span>{opt.emoji}</span>
              <span className="truncate">{opt.label}</span>
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
              {meta?.total ?? reports.length} laporan
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
                {opt.value !== "all" && statusCounts[opt.value] != null && (
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
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))
          ) : error ? (
            <ErrorState message={error} onRetry={refetch} />
          ) : reports.length === 0 ? (
            <EmptyState hasFilter={activeFilter !== "all"} />
          ) : (
            reports.map((report) => (
              <ReportCard
                key={report.id}
                report={report}
                isSelected={selectedReport === report.id}
                onClick={() => handleReportDetailOpen(report.id)}
              />
            ))
          )}
        </div>

        {/* Sidebar footer stats */}
        <div className="shrink-0 border-t border-gray-100 bg-gray-50 px-4 py-3">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-muted">Peta Laporan Infrastruktur</span>
            <span className="font-semibold text-navy">
              {meta?.total ?? reports.length} total laporan
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
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))
          ) : error ? (
            <ErrorState message={error} onRetry={refetch} />
          ) : reports.length === 0 ? (
            <EmptyState hasFilter={activeFilter !== "all"} />
          ) : (
            reports.map((report) => (
              <ReportCard
                key={report.id}
                report={report}
                isSelected={selectedReport === report.id}
                onClick={() => handleReportDetailOpen(report.id)}
              />
            ))
          )}
        </div>
      </div>

      {/* ═══ Map View ═══ */}
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
        <div className="absolute bottom-24 md:bottom-6 right-3 z-[1000] rounded-xl bg-white p-3 shadow-lg">
          <p className="mb-2 font-display text-[10px] font-bold uppercase tracking-wider text-navy">
            Status Laporan
          </p>
          <div className="space-y-1">
            {FILTER_OPTIONS.filter((o) => o.value !== "all").map((opt) => (
              <div key={opt.value} className="flex items-center gap-2">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: STATUS_MARKER_COLORS[opt.value as ReportStatus] }}
                />
                <span className="text-[10px] text-muted">{opt.label}</span>
              </div>
            ))}
          </div>
        </div>

        <MapView
          reports={reports}
          onReportClick={handleReportDetailOpen}
        />
      </div>

      {/* ═══ Report Detail Modal ═══ */}
      {detailReportId && (
        <ReportDetailModal
          reportId={detailReportId}
          onClose={() => setDetailReportId(null)}
        />
      )}
    </div>
  );
}
