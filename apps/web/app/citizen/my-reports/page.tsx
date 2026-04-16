// ── app/citizen/my-reports/page.tsx ──
// My reports page

"use client";

import { useState, useMemo } from "react";
import { MOCK_REPORTS } from "@/data/mock-reports";
import { mockToReport } from "@/lib/mock-adapter";
import { FilterChips } from "@/components/dashboard/shared/FilterChips";
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

  // For demo purposes, show first 5 reports as "my reports"
  const myReports = MOCK_REPORTS.slice(0, 5);

  // Filter reports based on active filter
  const filteredReports = useMemo(() => {
    let reports = [...myReports];

    switch (activeFilter) {
      case "active":
        reports = reports.filter(
          (r) => r.status === "baru" || r.status === "diverifikasi" || r.status === "diproses"
        );
        break;
      case "completed":
        reports = reports.filter(
          (r) => r.status === "selesai" || r.status === "terverifikasi"
        );
        break;
      case "rejected":
        // No rejected reports in mock data
        reports = [];
        break;
    }

    // Convert to Report format
    return reports.map(mockToReport);
  }, [activeFilter, myReports]);

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

      {/* Empty State */}
      {filteredReports.length === 0 && (
        <EmptyState
          icon={FileText}
          title="Belum ada laporan"
          description={
            activeFilter === "all"
              ? "Kamu belum membuat laporan. Buat laporan pertamamu sekarang!"
              : `Tidak ada laporan dengan status "${FILTER_OPTIONS.find((f) => f.value === activeFilter)?.label}"`
          }
          actionLabel={activeFilter === "all" ? "Buat Laporan" : undefined}
          onAction={
            activeFilter === "all"
              ? () => router.push("/citizen/reports/new")
              : undefined
          }
        />
      )}

      {/* Report List - Grid on Desktop */}
      {filteredReports.length > 0 && (
        <>
          <div className="mb-4 text-sm text-muted">
            {filteredReports.length} laporan
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredReports.map((report) => (
              <ReportCard key={report.id} report={report} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
