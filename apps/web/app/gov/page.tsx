// ── app/gov/page.tsx ──
"use client";
import { useState } from "react";

import { 
  ClipboardList, Plus, AlertTriangle, Star, 
  BarChart3, TrendingUp, Clock, CheckCircle2, ArrowUpRight, 
  ArrowDownRight, MoreHorizontal, MapPin, 
  Brain, Zap, LayoutDashboard, RefreshCw
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useGovDashboard } from "@/hooks/useGovDashboard";
import { useToast } from "@/hooks/useToast";
import { formatRelativeTime } from "@/lib/utils";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, BarChart, Bar, Cell 
} from "recharts";

// ─── Components ───────────────────────────────────────────────────────────────

function KpiCard({ 
  title, value, trend, icon: Icon, color, href, isLoading 
}: { 
  title: string; value: string | number; trend?: number; 
  icon: any; color: string; href: string; isLoading?: boolean 
}) {
  return (
    <Link 
      href={href}
      className="group relative overflow-hidden rounded-2xl bg-white border border-border p-5 shadow-sm hover:shadow-md hover:border-blue/20 transition-all duration-300"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-navy">
            {isLoading ? <span className="inline-block w-16 h-8 bg-surface animate-pulse rounded" /> : value}
          </h3>
          {trend !== undefined && (
            <div className={cn(
              "mt-2 flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full w-fit",
              trend >= 0 ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
            )}>
              {trend >= 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
              {Math.abs(trend)}% vs kemarin
            </div>
          )}
        </div>
        <div className={cn("p-3 rounded-xl", color)}>
          <Icon size={20} className="text-white" />
        </div>
      </div>
      <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
        <Icon size={80} />
      </div>
    </Link>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function GovDashboardPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  const { stats, isLoading, error, generateInsights } = useGovDashboard();

  if (error) {
    return (
      <div className="p-8 max-w-[1600px] mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <AlertTriangle className="mx-auto text-red-500 mb-2" size={32} />
          <h2 className="text-lg font-bold text-red-700">Gagal Memuat Data</h2>
          <p className="text-sm text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-colors"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  const currentDate = new Intl.DateTimeFormat("id-ID", {
    weekday: "long", day: "numeric", month: "long", year: "numeric"
  }).format(new Date());

  const chartColors = ["#2563EB", "#7C3AED", "#DB2777", "#EA580C", "#059669"];

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <LayoutDashboard size={18} className="text-blue" />
            <h1 className="text-2xl font-bold font-display text-navy">Pusat Komando Dasbor</h1>
          </div>
          <p className="text-sm text-muted">{currentDate} · {user?.agencyName || "Laporin Government"}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-lg bg-green-50 border border-green-200 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[11px] font-bold text-green-700 uppercase">Sistem Online</span>
          </div>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <KpiCard 
          title="Total Laporan"
          value={stats?.totalReports || 0}
          trend={stats?.trendPercent ?? undefined}
          icon={ClipboardList}
          color="bg-blue"
          href="/gov/reports"
          isLoading={isLoading}
        />
        <KpiCard 
          title="SLA Breach"
          value={stats?.slaBreachedCount || 0}
          icon={AlertTriangle}
          color="bg-red-500"
          href="/gov/reports?filter=sla_breached"
          isLoading={isLoading}
        />
        <KpiCard 
          title="Kepuasan Publik"
          value={stats?.satisfactionAvg ? `${stats.satisfactionAvg}/5.0` : "—"}
          icon={Star}
          color="bg-amber-500"
          href="/gov/analytics"
          isLoading={isLoading}
        />
        <KpiCard 
          title="Kepatuhan SLA"
          value={stats?.slaCompliance ? `${stats.slaCompliance}%` : "0%"}
          icon={CheckCircle2}
          color="bg-emerald-500"
          href="/gov/analytics"
          isLoading={isLoading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
        
        {/* Main Analytics Section - 8 cols */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Trend Chart */}
          <div className="rounded-2xl bg-white border border-border p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-base font-bold text-navy flex items-center gap-2">
                  <TrendingUp size={16} className="text-blue" />
                  Tren Volume Laporan
                </h2>
                <p className="text-xs text-muted">Aktivitas 30 hari terakhir</p>
              </div>
              <select className="text-xs bg-surface border-border rounded-lg px-3 py-1.5 outline-none">
                <option>30 Hari Terakhir</option>
                <option>7 Hari Terakhir</option>
              </select>
            </div>
            <div className="h-[220px] md:h-[300px] w-full">
              {isLoading ? (
                <div className="w-full h-full bg-surface animate-pulse rounded-xl" />
              ) : (
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <AreaChart data={stats?.trendData || []}>
                    <defs>
                      <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563EB" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fill: "#6B7280" }} 
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fill: "#6B7280" }} 
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="count" 
                      stroke="#2563EB" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorCount)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Bottom Grid: Recent Reports + Category Dist */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            
            {/* Recent Reports */}
            <div className="rounded-2xl bg-white border border-border p-6 shadow-sm flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-navy flex items-center gap-2">
                  <Clock size={16} className="text-blue" />
                  Aktivitas Terbaru
                </h2>
                <Link href="/gov/reports" className="text-xs text-blue font-bold hover:underline">Lihat Semua</Link>
              </div>
              <div className="space-y-4 flex-1">
                {isLoading ? (
                  [1,2,3].map(i => <div key={i} className="h-16 bg-surface animate-pulse rounded-xl" />)
                ) : stats?.recentReports.map(r => (
                  <div key={r.id} className="flex items-center gap-3 group">
                    <div className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center text-lg">
                      {r.categoryEmoji || "📍"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-navy truncate group-hover:text-blue transition-colors">
                        {r.locationAddress}
                      </p>
                      <p className="text-[10px] text-muted">{r.trackingCode} · {r.categoryName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-muted">{formatRelativeTime(r.createdAt)}</p>
                      <span className={cn(
                        "text-[9px] font-bold px-1.5 py-0.5 rounded uppercase",
                        r.status === 'new' ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                      )}>
                        {r.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Category Distribution */}
            <div className="rounded-2xl bg-white border border-border p-6 shadow-sm">
              <div className="mb-4">
                <h2 className="text-sm font-bold text-navy flex items-center gap-2">
                  <BarChart3 size={16} className="text-blue" />
                  Kategori Teratas
                </h2>
                <p className="text-[10px] text-muted">Berdasarkan volume laporan</p>
              </div>
              <div className="h-[180px] md:h-[200px] w-full">
                {isLoading ? (
                  <div className="w-full h-full bg-surface animate-pulse rounded-xl" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <BarChart data={stats?.categoryDistribution || []} layout="vertical">
                      <XAxis type="number" hide />
                      <YAxis 
                        dataKey="name" 
                        type="category" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fill: "#4B5563", fontWeight: 500 }}
                        width={100}
                      />
                      <Tooltip cursor={{ fill: 'transparent' }} />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                        {stats?.categoryDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Section - 4 cols */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* AI Insights Card */}
          <div className="rounded-2xl bg-gradient-to-br from-navy to-blue p-6 text-white shadow-lg relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-white/20">
                    <Brain size={18} className="text-white" />
                  </div>
                  <h2 className="text-base font-bold">Ringkasan AI Intelijen</h2>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      setIsGeneratingInsights(true);
                      await generateInsights();
                      toast.success("Insight AI berhasil diperbarui");
                    } catch (err: any) {
                      toast.error(err.message || "Gagal memperbarui insight AI");
                    } finally {
                      setIsGeneratingInsights(false);
                    }
                  }}
                  disabled={isGeneratingInsights || isLoading}
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-50 transition-colors"
                  title="Perbarui Insight"
                >
                  <RefreshCw size={14} className={isGeneratingInsights ? "animate-spin" : ""} />
                </button>
              </div>
              <div className="space-y-4">
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10">
                  <div className="flex items-center gap-2 mb-2 text-blue-200">
                    <Zap size={14} />
                    <span className="text-[11px] font-bold uppercase tracking-wider">Insight Utama</span>
                  </div>
                  <p className="text-xs leading-relaxed text-blue-50">
                    {isLoading || isGeneratingInsights ? (
                      <span className="inline-block w-full h-4 bg-white/20 animate-pulse rounded" />
                    ) : stats?.aiInsight ? (
                      stats.aiInsight
                    ) : (
                      "Insight AI sedang diproses. Klik tombol perbarui di atas untuk memproses ulang."
                    )}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/5 p-3 rounded-xl">
                    <p className="text-[10px] text-blue-200 mb-1">Prediksi Beban</p>
                    <p className="text-sm font-bold">
                      {stats?.workloadForecast != null
                        ? `${stats.workloadForecast >= 0 ? '+' : ''}${stats.workloadForecast}% Minggu Depan`
                        : "— Data belum cukup"}
                    </p>
                  </div>
                  <div className="bg-white/5 p-3 rounded-xl">
                    <p className="text-[10px] text-blue-200 mb-1">Skor Efisiensi</p>
                    <p className="text-sm font-bold">
                      {stats?.efficiencyScore != null ? `${stats.efficiencyScore} / 10` : "—"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-2xl" />
          </div>

          {/* Urgent Priority Reports */}
          <div className="rounded-2xl bg-white border border-border p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-navy flex items-center gap-2">
                <AlertTriangle size={16} className="text-red-500" />
                Prioritas Darurat
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-600 text-[10px] font-bold">
                {stats?.urgentReports.length || 0} Perlu Respon
              </span>
            </div>
            <div className="space-y-3">
              {isLoading ? (
                [1,2].map(i => <div key={i} className="h-20 bg-surface animate-pulse rounded-xl" />)
              ) : stats?.urgentReports.length === 0 ? (
                <div className="text-center py-6 text-muted italic text-xs">
                  Tidak ada laporan darurat aktif.
                </div>
              ) : stats?.urgentReports.map(r => (
                <Link 
                  key={r.id} 
                  href={`/gov/reports/${r.id}`}
                  className="block p-3 rounded-xl border border-red-100 bg-red-50/30 hover:bg-red-50 transition-colors"
                >
                  <p className="text-xs font-bold text-red-700 mb-1">{r.title}</p>
                  <div className="flex items-center gap-1.5 text-[10px] text-red-600/70">
                    <MapPin size={10} />
                    <span className="truncate">{r.locationAddress}</span>
                  </div>
                  <div className="mt-2 text-[9px] font-mono font-bold text-red-800">
                    {r.trackingCode}
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Help Center CTA */}
          <div className="rounded-2xl bg-surface border border-dashed border-border p-5 text-center">
            <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center mx-auto mb-3">
              <MoreHorizontal size={20} className="text-muted" />
            </div>
            <h3 className="text-xs font-bold text-navy mb-1">Butuh Bantuan Analisis?</h3>
            <p className="text-[10px] text-muted mb-4">Tanyakan pada AI Assistant kami untuk ringkasan data lebih dalam.</p>
            <Link 
              href="/gov/ai-assistant"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-border text-[11px] font-bold text-navy hover:bg-surface transition-all shadow-sm"
            >
              Buka AI Assistant
              <ArrowUpRight size={12} />
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
