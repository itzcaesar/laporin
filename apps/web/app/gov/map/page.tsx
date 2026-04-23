// ── app/gov/map/page.tsx ──
"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  Layers, MapPin, AlertTriangle, Clock, Eye, EyeOff,
  ChevronDown, ChevronUp, X, Flame, Navigation, Loader2,
  BarChart3, TrendingUp, Filter, Search, ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api-client";
import LoadingSkeleton from "@/components/dashboard/shared/LoadingSkeleton";
import type { Report, ReportStatus } from "@/types";

// Dynamic imports for Leaflet (SSR-safe)
const MapContainer = dynamic(() => import("react-leaflet").then((m) => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then((m) => m.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then((m) => m.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then((m) => m.Popup), { ssr: false });
const CircleMarker = dynamic(() => import("react-leaflet").then((m) => m.CircleMarker), { ssr: false });
const Tooltip = dynamic(() => import("react-leaflet").then((m) => m.Tooltip), { ssr: false });

// ─── Types ────────────────────────────────────────────────────────────────────

interface CategoryOption {
  id: number;
  name: string;
  emoji: string;
}

interface HeatmapPoint {
  lat: number;
  lng: number;
  count: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_MAP: Record<string, { label: string; color: string; dot: string }> = {
  new: { label: "Baru", color: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500" },
  verified: { label: "Diverifikasi", color: "bg-blue-50 text-blue-700 border-blue-200", dot: "bg-blue-500" },
  in_progress: { label: "Diproses", color: "bg-indigo-50 text-indigo-700 border-indigo-200", dot: "bg-indigo-500" },
  completed: { label: "Selesai", color: "bg-green-50 text-green-700 border-green-200", dot: "bg-green-500" },
  verified_complete: { label: "Diverifikasi Selesai", color: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  rejected: { label: "Ditolak", color: "bg-red-50 text-red-700 border-red-200", dot: "bg-red-500" },
  disputed: { label: "Disengketakan", color: "bg-orange-50 text-orange-700 border-orange-200", dot: "bg-orange-500" },
  closed: { label: "Ditutup", color: "bg-gray-50 text-gray-700 border-gray-200", dot: "bg-gray-400" },
};

const PRIORITY_MAP: Record<string, { label: string; color: string }> = {
  urgent: { label: "Darurat", color: "text-red-600" },
  high: { label: "Tinggi", color: "text-orange-600" },
  medium: { label: "Sedang", color: "text-amber-600" },
  low: { label: "Rendah", color: "text-green-600" },
};

// ─── Helper: Time ago ─────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) return `${diffMins} menit lalu`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} jam lalu`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays} hari lalu`;
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

// ─── StatusBadge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_MAP[status] ?? STATUS_MAP.new;
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full border", s.color)}>
      <span className={cn("w-1.5 h-1.5 rounded-full", s.dot)} />
      {s.label}
    </span>
  );
}

// ─── Report Card (Sidebar) ────────────────────────────────────────────────────

function ReportCard({
  report, isSelected, onClick,
}: { report: Report; isSelected: boolean; onClick: () => void }) {
  const priority = PRIORITY_MAP[report.priority] ?? PRIORITY_MAP.medium;
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left p-3 rounded-xl border transition-all",
        isSelected
          ? "bg-blue-50 border-blue ring-2 ring-blue/20"
          : "bg-white border-border hover:border-blue/30 hover:shadow-sm"
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-base">{report.categoryEmoji || "📍"}</span>
          <span className="text-[11px] font-mono font-semibold text-blue truncate">{report.trackingCode}</span>
        </div>
        <StatusBadge status={report.status} />
      </div>
      <p className="text-xs text-ink leading-relaxed line-clamp-2 mb-1.5">{report.locationAddress}</p>
      <div className="flex items-center justify-between">
        <span className={cn("text-[10px] font-medium", priority.color)}>
          ● {priority.label}
        </span>
        <span className="text-[10px] text-muted">{timeAgo(report.createdAt)}</span>
      </div>
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function GovMapPage() {
  const [isClient, setIsClient] = useState(false);

  // Data
  const [reports, setReports] = useState<Report[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [heatmapData, setHeatmapData] = useState<HeatmapPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState("30");

  // Layers
  const [layers, setLayers] = useState({
    reportPins: true,
    heatmap: false,
  });

  // UI
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [controlsOpen, setControlsOpen] = useState(true);

  useEffect(() => {
    setIsClient(true);

    // Fix Leaflet default marker icon (broken in bundlers like Webpack/Turbopack)
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    });
  }, []);

  // ── Fetch all reports using gov endpoint ──
  const fetchReports = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ limit: "100", sortBy: "createdAt", sortOrder: "desc" });
      if (categoryFilter !== "all") params.set("categoryId", categoryFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);

      const res = await api.get<{ data: Report[] }>(`/gov/reports?${params}`);
      setReports(res.data ?? []);
    } catch (e) {
      console.error("Failed to fetch reports for map:", e);
      setReports([]);
    } finally {
      setIsLoading(false);
    }
  }, [categoryFilter, statusFilter]);

  // ── Fetch categories ──
  useEffect(() => {
    api.get<{ data: CategoryOption[] }>("/categories")
      .then((res) => setCategories(res.data ?? []))
      .catch(() => setCategories([]));
  }, []);

  // ── Fetch heatmap ──
  useEffect(() => {
    if (!layers.heatmap) return;
    api.get<{ data: HeatmapPoint[] }>(`/map/heatmap?days=${dateRange}&minLat=-7.1&maxLat=-6.7&minLng=107.4&maxLng=107.8`)
      .then((res) => setHeatmapData(res.data ?? []))
      .catch(() => setHeatmapData([]));
  }, [layers.heatmap, dateRange]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  // ── Filtered + searched pins ──
  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      if (!r.locationLat || !r.locationLng) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesSearch =
          r.trackingCode.toLowerCase().includes(q) ||
          r.locationAddress.toLowerCase().includes(q) ||
          (r.categoryName || "").toLowerCase().includes(q);
        if (!matchesSearch) return false;
      }
      return true;
    });
  }, [reports, searchQuery]);

  // ── Stats ──
  const stats = useMemo(() => {
    const total = filteredReports.length;
    const urgent = filteredReports.filter((r) => r.priority === "urgent" || r.priority === "high").length;
    const inProgress = filteredReports.filter((r) => r.status === "in_progress").length;
    const newReports = filteredReports.filter((r) => r.status === "new" || r.status === "verified").length;
    return { total, urgent, inProgress, newReports };
  }, [filteredReports]);

  if (!isClient) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center bg-surface">
        <div className="flex items-center gap-3 text-muted">
          <Loader2 size={20} className="animate-spin" />
          <span className="text-sm">Memuat peta...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-[calc(100vh-4rem)] flex bg-surface overflow-hidden">

      {/* ── Sidebar ── */}
      <aside
        className={cn(
          "flex flex-col bg-white border-r border-border z-[1001] transition-all duration-300 flex-shrink-0",
          sidebarCollapsed ? "w-0 overflow-hidden" : "w-80"
        )}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-border flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold font-display text-navy">Peta Laporan</h2>
            <button onClick={() => setSidebarCollapsed(true)} className="text-muted hover:text-ink p-1 rounded-lg hover:bg-surface transition-colors">
              <X size={16} />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari kode/alamat..."
              className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border border-border bg-surface focus:bg-white focus:border-blue focus:ring-2 focus:ring-blue/10 outline-none transition-all"
            />
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-2 p-3 border-b border-border flex-shrink-0">
          {[
            { label: "Total", value: stats.total, icon: MapPin, color: "text-blue", bg: "bg-blue-50" },
            { label: "Darurat", value: stats.urgent, icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50" },
            { label: "Proses", value: stats.inProgress, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
            { label: "Baru", value: stats.newReports, icon: TrendingUp, color: "text-green-600", bg: "bg-green-50" },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="flex items-center gap-2 p-2 rounded-lg bg-surface">
                <div className={cn("w-6 h-6 rounded-md flex items-center justify-center", s.bg)}>
                  <Icon size={12} className={s.color} />
                </div>
                <div>
                  <p className="text-xs font-bold text-navy leading-none">{s.value}</p>
                  <p className="text-[9px] text-muted">{s.label}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Report List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {isLoading ? (
            <LoadingSkeleton variant="map-sidebar" />
          ) : filteredReports.length === 0 ? (
            <div className="text-center py-10">
              <MapPin size={28} className="mx-auto text-muted/30 mb-2" />
              <p className="text-xs text-muted">Tidak ada laporan ditemukan</p>
            </div>
          ) : (
            filteredReports.map((r) => (
              <ReportCard
                key={r.id}
                report={r}
                isSelected={selectedReport?.id === r.id}
                onClick={() => setSelectedReport(r)}
              />
            ))
          )}
        </div>
      </aside>

      {/* ── Map Area ── */}
      <div className="flex-1 relative">
        <MapContainer
          center={[-6.9175, 107.6191]}
          zoom={13}
          style={{ height: "100%", width: "100%" }}
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Report Pins */}
          {layers.reportPins && filteredReports.map((pin) => (
            <Marker key={pin.id} position={[pin.locationLat!, pin.locationLng!]}>
              <Popup maxWidth={320} minWidth={280}>
                <div className="p-1.5 font-sans">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xl">{pin.categoryEmoji || "📍"}</span>
                      <div className="min-w-0">
                        <p className="font-mono text-xs font-bold text-blue">{pin.trackingCode}</p>
                        <p className="text-[11px] text-gray-500">{pin.categoryName || "Infrastruktur"}</p>
                      </div>
                    </div>
                    <StatusBadge status={pin.status} />
                  </div>

                  {/* Address */}
                  <p className="text-xs text-gray-700 leading-relaxed mb-2">
                    📍 {pin.locationAddress}
                  </p>

                  {/* Meta Grid */}
                  <div className="grid grid-cols-2 gap-2 mb-3 text-[11px]">
                    <div className="bg-gray-50 rounded-lg p-1.5">
                      <span className="text-gray-400 block">Prioritas</span>
                      <span className={cn("font-semibold", PRIORITY_MAP[pin.priority]?.color ?? "text-gray-600")}>
                        {PRIORITY_MAP[pin.priority]?.label ?? pin.priority}
                      </span>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-1.5">
                      <span className="text-gray-400 block">Bahaya</span>
                      <span className="font-semibold text-gray-700">{pin.dangerLevel}/100</span>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-1.5">
                      <span className="text-gray-400 block">Upvote</span>
                      <span className="font-semibold text-gray-700">👍 {pin.upvoteCount}</span>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-1.5">
                      <span className="text-gray-400 block">Waktu</span>
                      <span className="font-semibold text-gray-700">{timeAgo(pin.createdAt)}</span>
                    </div>
                  </div>

                  {/* AI Summary */}
                  {pin.aiSummary && (
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-2 mb-3">
                      <p className="text-[10px] font-semibold text-blue-700 mb-0.5">🤖 AI Ringkasan</p>
                      <p className="text-[11px] text-blue-800 leading-relaxed line-clamp-3">{pin.aiSummary}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <a
                    href={`/gov/reports/${pin.id}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      width: "100%",
                      borderRadius: "8px",
                      border: "1.5px solid #2563EB",
                      padding: "8px 0",
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#2563EB",
                      textDecoration: "none",
                      transition: "all 0.15s",
                      background: "#EFF6FF",
                    }}
                    onMouseOver={(e) => { (e.target as HTMLElement).style.background = "#2563EB"; (e.target as HTMLElement).style.color = "#fff"; }}
                    onMouseOut={(e) => { (e.target as HTMLElement).style.background = "#EFF6FF"; (e.target as HTMLElement).style.color = "#2563EB"; }}
                  >
                    Buka Detail →
                  </a>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Heatmap circles */}
          {layers.heatmap && heatmapData.map((point, i) => (
            <CircleMarker
              key={`heat-${i}`}
              center={[point.lat, point.lng]}
              radius={Math.min(6 + point.count * 4, 30)}
              pathOptions={{
                fillColor: point.count > 3 ? "#DC2626" : point.count > 1 ? "#F59E0B" : "#3B82F6",
                fillOpacity: 0.5,
                stroke: true,
                color: point.count > 3 ? "#DC2626" : point.count > 1 ? "#F59E0B" : "#3B82F6",
                weight: 1,
                opacity: 0.3,
              }}
            >
              <Tooltip>
                <span className="text-xs font-medium">{point.count} laporan di area ini</span>
              </Tooltip>
            </CircleMarker>
          ))}
        </MapContainer>

        {/* Sidebar Toggle (when collapsed) */}
        {sidebarCollapsed && (
          <button
            onClick={() => setSidebarCollapsed(false)}
            className="absolute top-4 left-4 z-[1001] bg-white border border-border rounded-xl px-3 py-2.5 shadow-lg flex items-center gap-2 text-xs font-medium text-navy hover:bg-surface transition-colors"
          >
            <Layers size={14} />
            Panel
          </button>
        )}

        {/* ── Top-Right Controls ── */}
        <div className="absolute top-4 right-4 z-[1001] w-72">

          {/* Controls Toggle */}
          <button
            onClick={() => setControlsOpen(!controlsOpen)}
            className="w-full flex items-center justify-between bg-white border border-border rounded-xl px-4 py-3 shadow-lg text-sm font-semibold text-navy hover:bg-surface transition-colors mb-2"
          >
            <div className="flex items-center gap-2">
              <Filter size={14} />
              Layer & Filter
            </div>
            {controlsOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {controlsOpen && (
            <div className="bg-white border border-border rounded-2xl p-4 shadow-lg space-y-4">

              {/* Layer Toggles */}
              <div className="space-y-2">
                <p className="text-[10px] uppercase tracking-widest text-muted font-semibold">Layer</p>
                {[
                  { key: "reportPins" as const, label: "Pin Laporan", icon: MapPin },
                  { key: "heatmap" as const, label: "Heatmap Kepadatan", icon: Flame },
                ].map((layer) => {
                  const Icon = layer.icon;
                  const active = layers[layer.key];
                  return (
                    <button
                      key={layer.key}
                      onClick={() => setLayers((p) => ({ ...p, [layer.key]: !p[layer.key] }))}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all text-left",
                        active
                          ? "bg-blue-50 text-blue border border-blue/20"
                          : "bg-surface text-muted border border-transparent hover:border-border"
                      )}
                    >
                      <Icon size={14} />
                      {layer.label}
                      <span className="ml-auto">
                        {active ? <Eye size={12} /> : <EyeOff size={12} />}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Category Filter */}
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-muted font-semibold mb-1.5">Kategori</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs text-ink focus:border-blue focus:outline-none focus:ring-2 focus:ring-blue/10"
                >
                  <option value="all">Semua Kategori</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={String(cat.id)}>
                      {cat.emoji} {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-muted font-semibold mb-1.5">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs text-ink focus:border-blue focus:outline-none focus:ring-2 focus:ring-blue/10"
                >
                  <option value="all">Semua Status</option>
                  {Object.entries(STATUS_MAP).map(([key, val]) => (
                    <option key={key} value={key}>{val.label}</option>
                  ))}
                </select>
              </div>

              {/* Time Range */}
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-muted font-semibold mb-1.5">Rentang Waktu</label>
                <div className="flex items-center gap-1 rounded-lg border border-border bg-surface p-1">
                  {["7", "30", "90"].map((d) => (
                    <button
                      key={d}
                      onClick={() => setDateRange(d)}
                      className={cn(
                        "flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
                        dateRange === d ? "bg-navy text-white shadow-sm" : "text-muted hover:text-ink hover:bg-white"
                      )}
                    >
                      {d} hari
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Bottom Stats Bar ── */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1001] bg-white/95 backdrop-blur-sm border border-border rounded-full px-6 py-2.5 shadow-lg flex items-center gap-6 text-xs">
          <div className="flex items-center gap-1.5">
            <MapPin size={12} className="text-blue" />
            <span className="font-bold text-navy">{stats.total}</span>
            <span className="text-muted">terlihat</span>
          </div>
          <div className="w-px h-4 bg-border" />
          <div className="flex items-center gap-1.5">
            <AlertTriangle size={12} className="text-red-500" />
            <span className="font-bold text-navy">{stats.urgent}</span>
            <span className="text-muted">darurat</span>
          </div>
          <div className="w-px h-4 bg-border" />
          <div className="flex items-center gap-1.5">
            <Clock size={12} className="text-amber-500" />
            <span className="font-bold text-navy">{stats.inProgress}</span>
            <span className="text-muted">proses</span>
          </div>
          {layers.heatmap && (
            <>
              <div className="w-px h-4 bg-border" />
              <div className="flex items-center gap-1.5">
                <Flame size={12} className="text-orange-500" />
                <span className="font-bold text-navy">{heatmapData.length}</span>
                <span className="text-muted">zona</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
