// ── app/gov/page.tsx ──
"use client";

import { ClipboardList, Plus, AlertTriangle, Star } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useGovDashboard } from "@/hooks/useGovDashboard";
import { KpiCard } from "@/components/dashboard/gov/KpiCard";
import { DaruratAlertBanner } from "@/components/dashboard/gov/DaruratAlertBanner";
import { SlaAlertBanner } from "@/components/dashboard/gov/SlaAlertBanner";
import { AiInsightBanner } from "@/components/dashboard/gov/AiInsightBanner";
import { WorkloadForecast } from "@/components/dashboard/gov/WorkloadForecast";
import EmptyState from "@/components/dashboard/shared/EmptyState";
import { formatRelativeTime } from "@/lib/utils";
import Link from "next/link";

export default function GovDashboardPage() {
  const { user } = useAuth();
  const { stats, isLoading, error } = useGovDashboard();

  // Format current date in Indonesian
  const currentDate = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Greeting */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold font-display text-navy mb-1">
          Selamat datang, {user?.name || "Petugas"} 👋
        </h1>
        <p className="text-sm text-muted">{currentDate}</p>
        <p className="text-sm text-muted">
          {user?.agencyName || "Dinas PU Bina Marga · Kota Bandung"}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 mb-6">
        <KpiCard
          title="Total Laporan"
          value={stats?.totalReports || 0}
          icon={ClipboardList}
          iconColor="blue"
          href="/gov/reports"
          isLoading={isLoading}
        />
        <KpiCard
          title="Baru Hari Ini"
          value={stats?.newToday || 0}
          subtitle="laporan baru"
          icon={Plus}
          iconColor="amber"
          href="/gov/reports?status=new"
          isLoading={isLoading}
        />
        <KpiCard
          title="SLA Terlampaui"
          value={stats?.slaBreachedCount || 0}
          subtitle="perlu ditangani"
          icon={AlertTriangle}
          iconColor="red"
          href="/gov/reports?filter=sla_breached"
          isLoading={isLoading}
        />
        <KpiCard
          title="Kepuasan"
          value={stats?.satisfactionAvg ? `${stats.satisfactionAvg}/5.0` : "—"}
          subtitle="rata-rata"
          icon={Star}
          iconColor="green"
          href="/gov/analytics"
          isLoading={isLoading}
        />
      </div>

      {/* Alert Banners */}
      <div className="space-y-4 mb-6">
        <DaruratAlertBanner urgentReports={stats?.urgentReports || []} />
        <SlaAlertBanner breachedCount={stats?.slaBreachedCount || 0} />
        <AiInsightBanner insight={stats?.aiInsight || null} isLoading={isLoading} />
      </div>

      {/* Recent Reports + Trend Chart */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5 mb-6">
        {/* Recent Reports - 60% */}
        <div className="lg:col-span-3">
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-border">
            <h2 className="text-base font-semibold font-display text-navy mb-4">
              Laporan Terbaru
            </h2>

            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="h-16 rounded-lg bg-gray-100 animate-pulse"
                  />
                ))}
              </div>
            ) : stats?.recentReports && stats.recentReports.length > 0 ? (
              <div className="space-y-2">
                {stats.recentReports.map((report) => (
                  <Link
                    key={report.id}
                    href={`/gov/reports/${report.id}`}
                    className="flex items-center gap-3 rounded-lg p-3 hover:bg-surface transition-colors group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-muted">
                          {report.trackingCode}
                        </span>
                        <span className="text-xs text-muted">·</span>
                        <span className="text-xs text-muted">
                          {report.status}
                        </span>
                      </div>
                      <p className="text-sm text-ink truncate">
                        {report.locationAddress}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-muted">
                        {formatRelativeTime(report.createdAt)}
                      </span>
                      <span className="text-muted group-hover:text-blue transition-colors">
                        →
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState
                icon="📋"
                title="Belum ada laporan baru"
                description="Laporan baru akan muncul di sini"
              />
            )}
          </div>
        </div>

        {/* Trend Chart - 40% */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-border">
            <h2 className="text-base font-semibold font-display text-navy mb-4">
              Tren 30 Hari
            </h2>
            <div className="flex flex-col items-center justify-center h-64 text-sm text-muted">
              <svg className="w-12 h-12 mb-3 text-muted/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
              </svg>
              <p>Grafik tren sedang dalam pengembangan</p>
            </div>
          </div>
        </div>
      </div>

      {/* Workload Forecast */}
      <WorkloadForecast forecast={null} isLoading={isLoading} />
    </div>
  );
}
