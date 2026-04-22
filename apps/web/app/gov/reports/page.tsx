// ── app/gov/reports/page.tsx ──
"use client";

import { useState, useMemo } from "react";
import { Download } from "lucide-react";
import { FilterBar, type FilterConfig } from "@/components/dashboard/shared/FilterBar";
import { Pagination } from "@/components/dashboard/shared/Pagination";
import { ReportTable, type ReportRow } from "@/components/dashboard/gov/ReportTable";
import { ReportTableMobileCard } from "@/components/dashboard/gov/ReportTableMobileCard";
import { BulkActionBar } from "@/components/dashboard/gov/BulkActionBar";
import { EmptyState } from "@/components/dashboard/shared/EmptyState";
import { FileText } from "lucide-react";

// Mock data - replace with API call
const MOCK_REPORTS: ReportRow[] = [
  {
    id: "1",
    trackingCode: "LP-26-001",
    categoryEmoji: "🛣",
    categoryName: "Jalan Rusak",
    locationAddress: "Jl. Sudirman No.12, Kel. Braga",
    status: "Diproses",
    priority: "urgent",
    picName: "Budi Santosa",
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    isHoaxFlagged: false,
    aiAnalysis: {
      priorityScore: 72,
      priorityLabel: "Tinggi",
      hoaxConfidence: 2,
      hoaxLabel: "Aman",
      dangerLevel: 3,
      dangerLabel: "Signifikan",
      aiSummary: "Lubang besar berdiameter ~50cm di jalur utama",
    },
  },
  {
    id: "2",
    trackingCode: "LP-26-002",
    categoryEmoji: "🌊",
    categoryName: "Drainase",
    locationAddress: "Jl. Asia Afrika No.45",
    status: "Baru",
    priority: "high",
    picName: null,
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    isHoaxFlagged: false,
    aiAnalysis: {
      priorityScore: 65,
      priorityLabel: "Sedang",
      hoaxConfidence: 5,
      hoaxLabel: "Aman",
      dangerLevel: 2,
      dangerLabel: "Rendah",
      aiSummary: "Saluran drainase tersumbat sampah",
    },
  },
  {
    id: "3",
    trackingCode: "LP-26-003",
    categoryEmoji: "🚦",
    categoryName: "Lampu Lalu Lintas",
    locationAddress: "Jl. Dago No.88",
    status: "Diverifikasi",
    priority: "medium",
    picName: "Agus Permana",
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    isHoaxFlagged: true,
    aiAnalysis: {
      priorityScore: 45,
      priorityLabel: "Sedang",
      hoaxConfidence: 65,
      hoaxLabel: "Kemungkinan Hoaks",
      dangerLevel: 2,
      dangerLabel: "Rendah",
      aiSummary: "Lampu lalu lintas mati di persimpangan",
    },
  },
];

const FILTER_CONFIGS: FilterConfig[] = [
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
    options: [
      { value: "all", label: "Semua Kategori" },
      { value: "1", label: "Jalan Rusak" },
      { value: "11", label: "Drainase" },
      { value: "3", label: "Lampu Lalu Lintas" },
    ],
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

  // Filter reports
  const filteredReports = useMemo(() => {
    let filtered = [...MOCK_REPORTS];

    // Apply filters
    if (activeFilters.status !== "all") {
      filtered = filtered.filter((r) =>
        r.status.toLowerCase().includes(activeFilters.status)
      );
    }
    if (activeFilters.priority !== "all") {
      filtered = filtered.filter((r) => r.priority === activeFilters.priority);
    }
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
  }, [activeFilters, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredReports.length / itemsPerPage);
  const paginatedReports = filteredReports.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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
          filters={FILTER_CONFIGS}
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

      {/* Desktop Table */}
      {paginatedReports.length > 0 ? (
        <>
          <ReportTable
            reports={paginatedReports}
            selectedIds={selectedIds}
            onSelectChange={setSelectedIds}
          />

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {paginatedReports.map((report) => (
              <ReportTableMobileCard key={report.id} report={report} />
            ))}
          </div>

          {/* Pagination */}
          <div className="mt-4">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredReports.length}
              onPageChange={setCurrentPage}
            />
          </div>
        </>
      ) : (
        <EmptyState
          icon={FileText}
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
