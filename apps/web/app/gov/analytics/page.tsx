// ── app/gov/analytics/page.tsx ──
"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { TrendChart } from "@/components/dashboard/gov/charts/TrendChart";
import { CategoryBar } from "@/components/dashboard/gov/charts/CategoryBar";
import { SlaRing } from "@/components/dashboard/gov/charts/SlaRing";
import { SatisfactionGauge } from "@/components/dashboard/gov/charts/SatisfactionGauge";
import { AnomalyAlerts } from "@/components/dashboard/gov/AnomalyAlerts";
import { CategoryTrendBars } from "@/components/dashboard/gov/CategoryTrendBars";
import { cn } from "@/lib/utils";

type Period = "30" | "90" | "365";

// Mock data - replace with API calls
const MOCK_TREND_DATA = [
  { date: "1 Apr", count: 45 },
  { date: "5 Apr", count: 52 },
  { date: "10 Apr", count: 48 },
  { date: "15 Apr", count: 61 },
  { date: "20 Apr", count: 58 },
  { date: "22 Apr", count: 67 },
];

const MOCK_CATEGORY_DATA = [
  { categoryName: "Jalan Rusak", emoji: "🛣", count: 234 },
  { categoryName: "Drainase", emoji: "🌊", count: 189 },
  { categoryName: "Lampu Lalu Lintas", emoji: "🚦", count: 156 },
  { categoryName: "Trotoar Disabilitas", emoji: "♿", count: 142 },
  { categoryName: "Taman Kota", emoji: "🌳", count: 98 },
];

const MOCK_ANOMALIES = [
  {
    id: "1",
    regionName: "Kec. Coblong",
    categoryName: "banjir",
    spikePercent: 340,
    hoursAgo: 48,
    reportCount: 23,
  },
  {
    id: "2",
    regionName: "Kec. Cicendo",
    categoryName: "drainase",
    spikePercent: 180,
    hoursAgo: 24,
    reportCount: 8,
  },
];

const MOCK_CATEGORY_TRENDS = [
  { emoji: "🛣", name: "Jalan Rusak", count: 234, changePercent: 12, isIncreasing: true },
  { emoji: "🌊", name: "Drainase", count: 189, changePercent: 34, isIncreasing: true },
  { emoji: "🚦", name: "Lampu Lalu Lintas", count: 156, changePercent: -8, isIncreasing: false },
  { emoji: "🌳", name: "Taman Kota", count: 98, changePercent: -2, isIncreasing: false },
];

const MOCK_AI_INSIGHTS = [
  "Kerusakan drainase di Kec. Cicendo meningkat 40% dalam 30 hari terakhir",
  "Laporan jalan rusak cenderung meningkat pada hari Senin (rata-rata +25%)",
  "Wilayah Kec. Coblong memiliki tingkat kepuasan tertinggi (4.8/5.0)",
  "Waktu respons rata-rata menurun 15% dibanding bulan lalu",
];

const MOCK_OFFICER_PERFORMANCE = [
  { name: "Budi Santosa", assigned: 45, completed: 42, avgDays: 3.2, rating: 4.8 },
  { name: "Agus Permana", assigned: 38, completed: 35, avgDays: 3.5, rating: 4.7 },
  { name: "Siti Nurhaliza", assigned: 32, completed: 30, avgDays: 2.8, rating: 4.9 },
];

export default function GovAnalyticsPage() {
  const [period, setPeriod] = useState<Period>("30");
  const [isLoading] = useState(false);

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold font-display text-navy">
          Analitik & Statistik
        </h1>
        <div className="flex items-center gap-3">
          {/* Period Selector */}
          <div className="flex items-center gap-1 rounded-xl border border-border bg-white p-1">
            {(["30", "90", "365"] as Period[]).map((p) => (
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
            1,247
          </div>
          <div className="text-sm text-muted">Laporan Masuk</div>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm border border-border">
          <div className="text-2xl font-bold font-display text-ink mb-1">
            1,189
          </div>
          <div className="text-sm text-muted">Terselesaikan</div>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm border border-border">
          <div className="text-2xl font-bold font-display text-ink mb-1">
            3.2
          </div>
          <div className="text-sm text-muted">Rata-rata Hari</div>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm border border-border">
          <div className="text-2xl font-bold font-display text-ink mb-1">
            95.3%
          </div>
          <div className="text-sm text-muted">SLA %</div>
        </div>
      </div>

      {/* Row 2: Primary Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
        <div className="lg:col-span-3">
          <TrendChart data={MOCK_TREND_DATA} isLoading={isLoading} />
        </div>
        <div className="lg:col-span-2">
          <CategoryBar data={MOCK_CATEGORY_DATA} isLoading={isLoading} />
        </div>
      </div>

      {/* Row 3: Performance Charts + AI Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <SlaRing onTime={1189} breached={58} isLoading={isLoading} />
        <SatisfactionGauge score={4.7} isLoading={isLoading} />
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-border">
          <h3 className="text-base font-semibold font-display text-navy mb-4">
            🤖 Insight AI
          </h3>
          <div className="space-y-3">
            {MOCK_AI_INSIGHTS.map((insight, index) => (
              <div key={index} className="flex items-start gap-2">
                <span className="text-teal shrink-0 mt-0.5">●</span>
                <p className="text-sm text-ink leading-relaxed">{insight}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Predictions Section */}
      <div className="space-y-6 mb-6">
        <h2 className="text-xl font-semibold font-display text-navy">
          🤖 Analisis Tren & Prediksi
        </h2>

        {/* Anomaly Alerts */}
        <AnomalyAlerts anomalies={MOCK_ANOMALIES} />

        {/* Category Trend Bars */}
        <CategoryTrendBars trends={MOCK_CATEGORY_TRENDS} isLoading={isLoading} />

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
              {MOCK_OFFICER_PERFORMANCE.map((officer) => (
                <tr key={officer.name} className="hover:bg-surface transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-ink">
                    {officer.name}
                  </td>
                  <td className="px-4 py-3 text-sm text-ink">
                    {officer.assigned}
                  </td>
                  <td className="px-4 py-3 text-sm text-ink">
                    {officer.completed}
                  </td>
                  <td className="px-4 py-3 text-sm text-ink">
                    {officer.avgDays}
                  </td>
                  <td className="px-4 py-3 text-sm text-ink">
                    ⭐ {officer.rating}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
