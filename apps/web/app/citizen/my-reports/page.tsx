// ── app/citizen/my-reports/page.tsx ──
// My reports page - shows user's own reports

"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { api, ApiClientError } from "@/lib/api-client";
import { FilterChips } from "@/components/dashboard/shared/FilterChips";
import EmptyState from "@/components/dashboard/shared/EmptyState";
import LoadingSkeleton from "@/components/dashboard/shared/LoadingSkeleton";
import { ReportCard } from "@/components/dashboard/citizen/ReportCard";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useEffect, useCallback } from "react";
import type { Report, ReportStatus, ApiResponse, PaginationMeta } from "@/types";

const FILTER_OPTIONS = [
  { label: "Semua", value: "" },
  { label: "Aktif", value: "active" },
  { label: "Selesai", value: "completed" },
  { label: "Ditolak", value: "rejected" },
];

export default function MyReportsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState("");
  const [reports, setReports] = useState<Report[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await api.get<ApiResponse<Report[]>>('/user/reports');
      let filteredReports = res.data;

      // Apply client-side filter
      if (activeFilter === "active") {
        filteredReports = filteredReports.filter((r) =>
          ["new", "verified", "in_progress"].includes(r.status)
        );
      } else if (activeFilter === "completed") {
        filteredReports = filteredReports.filter((r) =>
          ["completed", "verified_complete"].includes(r.status)
        );
      } else if (activeFilter === "rejected") {
        filteredReports = filteredReports.filter((r) => r.status === "rejected");
      }

      setReports(filteredReports);
      setMeta(res.meta ?? null);
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.userMessage
          : "Gagal memuat laporan Anda"
      );
      setReports([]);
    } finally {
      setIsLoading(false);
    }
  }, [activeFilter]);

  useEffect(() => {
    if (user) {
      fetchReports();
    }
  }, [user, fetchReports]);

  return (
    <div className="dashboard-page">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-display text-navy">
            Laporan Saya
          </h1>
          <p className="text-sm text-muted mt-1">
            Kelola dan pantau semua laporan yang kamu buat
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => router.push("/citizen/reports/new")}
          className="hidden md:flex"
        >
          <Plus size={16} />
          Buat Laporan
        </Button>
      </div>

      {/* Filter Chips */}
      <FilterChips
        options={FILTER_OPTIONS}
        active={activeFilter}
        onChange={setActiveFilter}
        className="mb-6"
      />

      {/* Loading State */}
      {isLoading && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <LoadingSkeleton key={i} variant="report-card" />
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-red-700 text-sm">
          {error}
          <button onClick={fetchReports} className="ml-2 underline font-medium">
            Coba lagi
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && reports.length === 0 && (
        <EmptyState
          icon="📄"
          title="Belum ada laporan"
          description={
            activeFilter === ""
              ? "Kamu belum membuat laporan. Buat laporan pertamamu sekarang!"
              : `Tidak ada laporan dengan status "${
                  FILTER_OPTIONS.find((f) => f.value === activeFilter)?.label
                }"`
          }
          action={
            activeFilter === ""
              ? { label: "Buat Laporan", href: "/citizen/reports/new" }
              : undefined
          }
        />
      )}

      {/* Report List - Grid on Desktop */}
      {!isLoading && !error && reports.length > 0 && (
        <>
          <div className="mb-4 text-sm text-muted">{reports.length} laporan</div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {reports.map((report) => (
              <ReportCard key={report.id} report={report} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
