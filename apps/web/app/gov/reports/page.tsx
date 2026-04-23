// ── app/gov/reports/page.tsx ──
"use client";

import { useState, useMemo } from "react";
import { Download } from "lucide-react";
import { FilterBar, type FilterConfig } from "@/components/dashboard/shared/FilterBar";
import { Pagination } from "@/components/dashboard/shared/Pagination";
import { ReportTable, type ReportRow } from "@/components/dashboard/gov/ReportTable";
import { ReportTableMobileCard } from "@/components/dashboard/gov/ReportTableMobileCard";
import { BulkActionBar } from "@/components/dashboard/gov/BulkActionBar";
import EmptyState from "@/components/dashboard/shared/EmptyState";
import LoadingSkeleton from "@/components/dashboard/shared/LoadingSkeleton";
import { useGovReports } from "@/hooks/useGovReports";
import { useCategories, type Category } from "@/hooks/useCategories";

// Helper to get priority label
const getPriorityLabel = (score: number): string => {
  if (score >= 80) return "Sangat Tinggi";
  if (score >= 60) return "Tinggi";
  if (score >= 40) return "Sedang";
  return "Rendah";
};

// Helper to get hoax label
const getHoaxLabel = (confidence: number | null): string => {
  if (!confidence) return "Aman";
  if (confidence >= 70) return "Kemungkinan Hoaks";
  if (confidence >= 40) return "Perlu Verifikasi";
  return "Aman";
};

// Helper to get danger label
const getDangerLabel = (level: number): string => {
  if (level >= 4) return "Sangat Berbahaya";
  if (level >= 3) return "Signifikan";
  if (level >= 2) return "Rendah";
  return "Minimal";
};

export default function GovReportsPage() {
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({
    status: "all",
    category: "all",
    priority: "all",
    special: "all",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Fetch categories for filter
  const { categories } = useCategories();

  // Build filters for API
  const apiFilters = useMemo(() => {
    const filters: any = {};
    
    if (activeFilters.status !== "all") {
      filters.status = activeFilters.status;
    }
    if (activeFilters.category !== "all") {
      filters.categoryId = parseInt(activeFilters.category, 10);
    }
    if (activeFilters.priority !== "all") {
      filters.priority = activeFilters.priority;
    }
    if (activeFilters.special === "sla_breached") {
      filters.slaBreached = true;
    }
    // Note: unassigned and hoax_detected filters need to be handled client-side
    // as they're not supported by the API yet
    
    return filters;
  }, [activeFilters]);

  // Fetch reports from API
  const { data: apiReports, meta, isLoading, error, refetch } = useGovReports(
    apiFilters,
    currentPage,
    itemsPerPage
  );

  // Transform API data to ReportRow format
  const reports: ReportRow[] = useMemo(() => {
    return apiReports.map((report) => ({
      id: report.id,
      trackingCode: report.trackingCode,
      categoryEmoji: report.category.emoji,
      categoryName: report.category.name,
      locationAddress: report.locationAddress,
      status: report.status,
      priority: report.priority,
      picName: report.assignedOfficer?.name || null,
      createdAt: report.createdAt,
      isHoaxFlagged: false, // TODO: Add hoax detection flag from AI analysis
      aiAnalysis: {
        priorityScore: report.priorityScore,
        priorityLabel: getPriorityLabel(report.priorityScore),
        hoaxConfidence: 0, // TODO: Get from AI analysis
        hoaxLabel: "Aman",
        dangerLevel: report.dangerLevel,
        dangerLabel: getDangerLabel(report.dangerLevel),
        aiSummary: null, // TODO: Get from report if available
      },
    }));
  }, [apiReports]);

  // Apply client-side filters (for filters not supported by API)
  const filteredReports = useMemo(() => {
    let filtered = [...reports];

    if (activeFilters.special === "unassigned") {
      filtered = filtered.filter((r) => !r.picName);
    }
    if (activeFilters.special === "hoax_detected") {
      filtered = filtered.filter((r) => r.isHoaxFlagged);
    }

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.trackingCode.toLowerCase().includes(query) ||
          r.locationAddress.toLowerCase().includes(query) ||
          r.categoryName.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [reports, activeFilters.special, searchQuery]);

  const handleFilterChange = (key: string, value: string) => {
    setActiveFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setActiveFilters({
      status: "all",
      category: "all",
      priority: "all",
      special: "all",
    });
    setSearchQuery("");
    setCurrentPage(1);
  };

  const hasActiveFilters =
    Object.values(activeFilters).some((v) => v !== "all") || searchQuery !== "";

  // Update filter configs with real categories
  const filterConfigs: FilterConfig[] = useMemo(() => {
    const categoryOptions = [
      { value: "all", label: "Semua Kategori" },
      ...categories.map((cat: Category) => ({
        value: cat.id.toString(),
        label: `${cat.emoji} ${cat.name}`,
      })),
    ];

    return [
      {
        key: "status",
        label: "Status",
        options: [
          { value: "all", label: "Semua" },
          { value: "new", label: "Baru" },
          { value: "verified", label: "Diverifikasi" },
          { value: "in_progress", label: "Diproses" },
          { value: "completed", label: "Selesai" },
          { value: "verified_complete", label: "Terverifikasi" },
          { value: "rejected", label: "Ditolak" },
        ],
      },
      {
        key: "category",
        label: "Kategori",
        options: categoryOptions,
      },
      {
        key: "priority",
        label: "Prioritas",
        options: [
          { value: "all", label: "Semua" },
          { value: "urgent", label: "Darurat" },
          { value: "high", label: "Tinggi" },
          { value: "medium", label: "Sedang" },
          { value: "low", label: "Rendah" },
        ],
      },
      {
        key: "special",
        label: "Filter Khusus",
        options: [
          { value: "all", label: "Tidak Ada" },
          { value: "sla_breached", label: "SLA Terlampaui" },
          { value: "unassigned", label: "Belum Ditugaskan" },
          { value: "hoax_detected", label: "Hoaks Terdeteksi" },
        ],
      },
    ];
  }, [categories]);

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold font-display text-navy">
          Daftar Laporan
        </h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2 text-sm font-medium text-ink hover:bg-surface transition-colors"
          >
            <Download size={16} />
            <span className="hidden sm:inline">Export PDF</span>
          </button>
          <button
            type="button"
            className="flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2 text-sm font-medium text-ink hover:bg-surface transition-colors"
          >
            <Download size={16} />
            <span className="hidden sm:inline">Export Excel</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="mb-4">
        <FilterBar
          filters={filterConfigs}
          activeFilters={activeFilters}
          onFilterChange={handleFilterChange}
          onClear={handleClearFilters}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
      </div>

      {/* Bulk Action Bar */}
      <BulkActionBar
        selectedCount={selectedIds.length}
        onAssignBulk={() => console.log("Assign bulk")}
        onUpdateStatusBulk={() => console.log("Update status bulk")}
        onClearSelection={() => setSelectedIds([])}
      />

      {/* Loading State */}
      {isLoading ? (
        <LoadingSkeleton variant="table" rows={1} />
      ) : error ? (
        /* Error State */
        <EmptyState
          icon="⚠️"
          title="Gagal memuat laporan"
          description={error}
          actionLabel="Coba Lagi"
          onAction={refetch}
        />
      ) : filteredReports.length > 0 ? (
        /* Success State */
        <>
          <ReportTable
            reports={filteredReports}
            selectedIds={selectedIds}
            onSelectChange={setSelectedIds}
          />

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {filteredReports.map((report) => (
              <ReportTableMobileCard key={report.id} report={report} />
            ))}
          </div>

          {/* Pagination */}
          <div className="mt-4">
            <Pagination
              currentPage={currentPage}
              totalPages={meta.pages}
              totalItems={meta.total}
              onPageChange={setCurrentPage}
            />
          </div>
        </>
      ) : (
        /* Empty State */
        <EmptyState
          icon="📄"
          title="Tidak ada laporan yang sesuai filter"
          description={
            hasActiveFilters
              ? "Coba ubah filter atau reset untuk melihat semua laporan"
              : "Belum ada laporan yang tersedia"
          }
          actionLabel={hasActiveFilters ? "Reset Filter" : undefined}
          onAction={hasActiveFilters ? handleClearFilters : undefined}
        />
      )}
    </div>
  );
}
