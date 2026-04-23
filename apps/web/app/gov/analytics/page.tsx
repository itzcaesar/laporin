// ── app/gov/analytics/page.tsx ──
"use client";

import { useState, useMemo } from "react";
import { Download } from "lucide-react";
import { TrendChart } from "@/components/dashboard/gov/charts/TrendChart";
import { CategoryBar } from "@/components/dashboard/gov/charts/CategoryBar";
import { SlaRing } from "@/components/dashboard/gov/charts/SlaRing";
import { SatisfactionGauge } from "@/components/dashboard/gov/charts/SatisfactionGauge";
import { AnomalyAlerts } from "@/components/dashboard/gov/AnomalyAlerts";
import { CategoryTrendBars } from "@/components/dashboard/gov/CategoryTrendBars";
import { cn } from "@/lib/utils";
import { useGovAnalytics } from "@/hooks/useGovAnalytics";
import type { TimePeriod } from "@/types/analytics";

export default function GovAnalyticsPage() {
  const [period, setPeriod] = useState<TimePeriod>("30");
  const { data, isLoading, error, refetch } = useGovAnalytics(period);

  // Memoize category trends transformation to avoid recalculation on every render
  // **Validates: Requirements 16.3**
  const categoryTrendsFormatted = useMemo(() => {
    return data.categoryTrends?.map((trend) => ({
      emoji: trend.emoji,
      name: trend.categoryName,
      count: trend.currentCount,
      changePercent: Math.abs(trend.changePercent),
      isIncreasing: trend.changePercent > 0,
    })) ?? [];
  }, [data.categoryTrends]);

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Error Banner */}
      {error && (
        <div className="mb-6 rounded-xl bg-red-50 border border-red-200 p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className="text-sm font-medium text-red-900 mb-1">
                Gagal memuat analitik
              </p>
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <button
              type="button"
              onClick={refetch}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
            >
              Coba Lagi
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold font-display text-navy">
          Analitik & Statistik
        </h1>
        <div className="flex items-center gap-3">
          {/* Period Selector */}
          <div className="flex items-center gap-1 rounded-xl border border-border bg-white p-1">
            {(["30", "90", "365"] as TimePeriod[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={cn(
                  "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                  period === p
                    ? "bg-navy text-white"
                    : "text-ink hover:bg-surface"
                )}
              >
                {p} Hari
              </button>
            ))}
          </div>
          {/* Export Button */}
          <button
            type="button"
            className="flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2 text-sm font-medium text-ink hover:bg-surface transition-colors"
          >
            <Download size={16} />
            <span className="hidden sm:inline">Export PDF</span>
          </button>
        </div>
      </div>

      {/* KPI Summary Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-2xl bg-white p-4 shadow-sm border border-border">
          <div className="text-2xl font-bold font-display text-ink mb-1">
            {isLoading ? "..." : (data.overview?.totalReports ?? 0).toLocaleString()}
          </div>
          <div className="text-sm text-muted">Laporan Masuk</div>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm border border-border">
          <div className="text-2xl font-bold font-display text-ink mb-1">
            {isLoading ? "..." : (data.overview?.completedReports ?? 0).toLocaleString()}
          </div>
          <div className="text-sm text-muted">Terselesaikan</div>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm border border-border">
          <div className="text-2xl font-bold font-display text-ink mb-1">
            {isLoading ? "..." : (data.overview?.avgResolutionDays ?? 0).toFixed(1)}
          </div>
          <div className="text-sm text-muted">Rata-rata Hari</div>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm border border-border">
          <div className="text-2xl font-bold font-display text-ink mb-1">
            {isLoading ? "..." : `${(data.overview?.slaCompliancePercent ?? 0).toFixed(1)}%`}
          </div>
          <div className="text-sm text-muted">SLA %</div>
        </div>
      </div>

      {/* Row 2: Primary Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
        <div className="lg:col-span-3">
          <TrendChart data={data.trends ?? []} isLoading={isLoading} />
        </div>
        <div className="lg:col-span-2">
          <CategoryBar data={data.categories ?? []} isLoading={isLoading} />
        </div>
      </div>

      {/* Row 3: Performance Charts + AI Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <SlaRing 
          onTime={data.sla?.onTime ?? 0} 
          breached={data.sla?.breached ?? 0} 
          isLoading={isLoading} 
        />
        <SatisfactionGauge 
          score={data.satisfaction?.averageRating ?? 0} 
          isLoading={isLoading} 
        />
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-border">
          <h3 className="text-base font-semibold font-display text-navy mb-4">
            🤖 Insight AI
          </h3>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-12 bg-surface rounded-lg animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {(data.insights?.insights ?? []).length > 0 ? (
                data.insights!.insights.map((insight, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <span className="text-teal shrink-0 mt-0.5">●</span>
                    <p className="text-sm text-ink leading-relaxed">{insight}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted">Belum ada insight tersedia</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* AI Predictions Section */}
      <div className="space-y-6 mb-6">
        <h2 className="text-xl font-semibold font-display text-navy">
          🤖 Analisis Tren & Prediksi
        </h2>

        {/* Anomaly Alerts */}
        <AnomalyAlerts anomalies={data.anomalies ?? []} />

        {/* Category Trend Bars */}
        <CategoryTrendBars trends={categoryTrendsFormatted} isLoading={isLoading} />

        {/* Risk Zone Map Placeholder */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold font-display text-navy">
              Peta Zona Risiko
            </h3>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="rounded-lg bg-navy px-3 py-1.5 text-xs font-medium text-white"
              >
                Aktual
              </button>
              <button
                type="button"
                className="rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-medium text-ink hover:bg-surface transition-colors"
              >
                Prediksi AI
              </button>
            </div>
          </div>
          <div className="rounded-xl bg-surface h-[400px] flex flex-col items-center justify-center text-muted border border-border">
            <svg className="w-16 h-16 mb-3 text-muted/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            <p className="text-sm">Peta heatmap sedang dalam pengembangan</p>
          </div>
        </div>
      </div>

      {/* Officer Performance Table */}
      <div className="rounded-2xl bg-white p-6 shadow-sm border border-border">
        <h3 className="text-base font-semibold font-display text-navy mb-4">
          Performa Petugas
        </h3>
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-surface rounded-lg animate-pulse" />
              ))}
            </div>
          ) : (data.officerPerformance ?? []).length > 0 ? (
            <table className="w-full">
              <thead className="border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase">
                    Petugas
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase">
                    Ditugaskan
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase">
                    Selesai
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase">
                    Avg Hari
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase">
                    Rating
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.officerPerformance!.map((officer) => (
                  <tr key={officer.officerId} className="hover:bg-surface transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-ink">
                      {officer.officerName}
                    </td>
                    <td className="px-4 py-3 text-sm text-ink">
                      {officer.assignedCount}
                    </td>
                    <td className="px-4 py-3 text-sm text-ink">
                      {officer.completedCount}
                    </td>
                    <td className="px-4 py-3 text-sm text-ink">
                      {officer.avgResolutionDays.toFixed(1)}
                    </td>
                    <td className="px-4 py-3 text-sm text-ink">
                      {officer.avgRating ? `⭐ ${officer.avgRating.toFixed(1)}` : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-muted text-center py-8">
              Belum ada data performa petugas
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
