// ── app/citizen/my-reports/page.tsx ──
// My reports page

"use client";

import { useState } from "react";
import { useReports } from "@/hooks/useReports";
import { FilterChips } from "@/components/dashboard/shared/FilterChips";
import { LoadingSkeleton } from "@/components/dashboard/shared/LoadingSkeleton";
import { EmptyState } from "@/components/dashboard/shared/EmptyState";
import { ReportCard } from "@/components/dashboard/citizen/ReportCard";
import { FileText, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

const FILTER_OPTIONS = [
  { label: "Semua", value: "all" },
  { label: "Aktif", value: "active" },
  { label: "Selesai", value: "completed" },
  { label: "Ditolak", value: "rejected" },
];

export default function MyReportsPage() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState("all");

  // TODO: Add userId filter when auth context is available
  const { reports, isLoading, error } = useReports({
    // reporterId: user?.id, // Add this when auth is integrated
  });

  // Filter reports based on active filter
  const filteredReports = reports.filter((report) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "active")
      return ["new", "verified", "in_progress"].includes(report.status);
    if (activeFilter === "completed")
      return ["completed", "verified_complete"].includes(report.status);
    if (activeFilter === "rejected")
      return ["rejected", "disputed", "closed"].includes(report.status);
    return true;
  });

  return (
    <div className="dashboard-page max-w-4xl mx-auto">
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

      {/* Error State */}
      {error && (
        <div className="card-base p-4 mb-4 bg-red-50 border-red-200">
          <p className="text-sm font-body text-red-800">⚠️ {error}</p>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <LoadingSkeleton variant="report-card" count={6} />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredReports.length === 0 && !error && (
        <EmptyState
          icon={FileText}
          title="Belum ada laporan"
          description="Kamu belum membuat laporan. Buat laporan pertamamu sekarang!"
          actionLabel="Buat Laporan"
          onAction={() => router.push("/citizen/reports/new")}
        />
      )}

      {/* Report List - Grid on Desktop */}
      {!isLoading && filteredReports.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredReports.map((report) => (
            <ReportCard key={report.id} report={report} />
          ))}
        </div>
      )}
    </div>
  );
}
