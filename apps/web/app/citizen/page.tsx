// ── app/citizen/page.tsx ──
// Citizen home/feed page with report list and filters

"use client";

import { useState, useMemo } from "react";
import { MOCK_REPORTS } from "@/data/mock-reports";
import { mockToReport } from "@/lib/mock-adapter";
import { FilterChips } from "@/components/dashboard/shared/FilterChips";
import { EmptyState } from "@/components/dashboard/shared/EmptyState";
import { ReportCard } from "@/components/dashboard/citizen/ReportCard";
import { Search, FileText } from "lucide-react";

const FILTER_OPTIONS = [
  { label: "Semua", value: "all" },
  { label: "Baru", value: "baru" },
  { label: "Diverifikasi", value: "diverifikasi" },
  { label: "Diproses", value: "diproses" },
  { label: "Selesai", value: "selesai" },
  { label: "Terverifikasi", value: "terverifikasi" },
];

export default function CitizenHomePage() {
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Filter reports based on active filter and search query
  const filteredReports = useMemo(() => {
    let reports = [...MOCK_REPORTS];

    // Filter by status
    if (activeFilter !== "all") {
      reports = reports.filter((r) => r.status === activeFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      reports = reports.filter(
        (r) =>
          r.title.toLowerCase().includes(query) ||
          r.description.toLowerCase().includes(query) ||
          r.location.toLowerCase().includes(query) ||
          r.category.toLowerCase().includes(query)
      );
    }

    // Convert to Report format
    return reports.map(mockToReport);
  }, [activeFilter, searchQuery]);

  const handleFilterChange = (value: string) => {
    setActiveFilter(value);
  };

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  };

  return (
    <div className="dashboard-page">
      {/* Page Header - Desktop */}
      <div className="hidden md:block mb-6">
        <h1 className="text-2xl font-bold font-display text-navy">
          Beranda
        </h1>
        <p className="text-sm text-muted mt-1">
          Lihat dan pantau semua laporan infrastruktur di area kamu
        </p>
      </div>

      {/* Mobile Search Bar */}
      <form onSubmit={handleSearch} className="mb-4 md:hidden">
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            type="search"
            placeholder="Cari laporan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-base pl-10"
          />
        </div>
      </form>

      {/* Filter Chips */}
      <FilterChips
        options={FILTER_OPTIONS}
        active={activeFilter}
        onChange={handleFilterChange}
        className="mb-6"
      />

      {/* Empty State */}
      {filteredReports.length === 0 && (
        <EmptyState
          icon={FileText}
          title="Tidak ada laporan"
          description={
            searchQuery
              ? `Tidak ada laporan yang cocok dengan "${searchQuery}"`
              : "Tidak ada laporan dengan status ini."
          }
        />
      )}

      {/* Report List - Grid on Desktop, Stack on Mobile */}
      {filteredReports.length > 0 && (
        <>
          <div className="mb-4 text-sm text-muted">
            Menampilkan {filteredReports.length} laporan
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
