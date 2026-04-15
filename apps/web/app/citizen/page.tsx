// ── app/citizen/page.tsx ──
// Citizen home/feed page with report list and filters

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useReports } from "@/hooks/useReports";
import { FilterChips } from "@/components/dashboard/shared/FilterChips";
import { LoadingSkeleton } from "@/components/dashboard/shared/LoadingSkeleton";
import { EmptyState } from "@/components/dashboard/shared/EmptyState";
import { ReportCard } from "@/components/dashboard/citizen/ReportCard";
import { Search, FileText } from "lucide-react";
import { useRouter } from "next/navigation";

const FILTER_OPTIONS = [
  { label: "Semua", value: "all" },
  { label: "Terdekat", value: "nearby" },
  { label: "Laporan Saya", value: "mine" },
  { label: "Baru", value: "new" },
  { label: "Diproses", value: "in_progress" },
  { label: "Selesai", value: "completed" },
];

export default function CitizenHomePage() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [allReports, setAllReports] = useState<any[]>([]);
  const observerTarget = useRef<HTMLDivElement>(null);

  // Build query params based on active filter
  const getQueryParams = () => {
    const params: any = { page, limit: 20 };

    if (searchQuery) {
      params.search = searchQuery;
    }

    switch (activeFilter) {
      case "mine":
        // This would need user ID from auth context
        // For now, we'll just filter on frontend or add a flag
        break;
      case "new":
        params.status = "new";
        break;
      case "in_progress":
        params.status = "in_progress";
        break;
      case "completed":
        params.status = "completed";
        break;
      case "nearby":
        // Would need geolocation - skip for now
        break;
    }

    return params;
  };

  const { reports, meta, isLoading, error } = useReports(getQueryParams());

  // Append new reports when page changes
  useEffect(() => {
    if (reports.length > 0) {
      if (page === 1) {
        setAllReports(reports);
      } else {
        setAllReports((prev) => [...prev, ...reports]);
      }
    }
  }, [reports, page]);

  // Reset to page 1 when filter or search changes
  useEffect(() => {
    setPage(1);
    setAllReports([]);
  }, [activeFilter, searchQuery]);

  // Infinite scroll observer
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries;
      if (target.isIntersecting && !isLoading && meta && page < meta.pages) {
        setPage((prev) => prev + 1);
      }
    },
    [isLoading, meta, page]
  );

  useEffect(() => {
    const element = observerTarget.current;
    if (!element) return;

    const observer = new IntersectionObserver(handleObserver, {
      threshold: 0.5,
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, [handleObserver]);

  const handleFilterChange = (value: string) => {
    setActiveFilter(value);
  };

  const handleSearch = (e: React.FormEvent) => {
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

      {/* Error State */}
      {error && (
        <div className="card-base p-4 mb-4 bg-red-50 border-red-200">
          <p className="text-sm font-body text-red-800">⚠️ {error}</p>
        </div>
      )}

      {/* Loading State (first load) */}
      {isLoading && page === 1 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <LoadingSkeleton variant="report-card" count={6} />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && allReports.length === 0 && !error && (
        <EmptyState
          icon={FileText}
          title="Belum ada laporan"
          description={
            activeFilter === "mine"
              ? "Kamu belum membuat laporan. Buat laporan pertamamu sekarang!"
              : "Belum ada laporan yang sesuai dengan filter ini."
          }
          actionLabel={activeFilter === "mine" ? "Buat Laporan" : undefined}
          onAction={
            activeFilter === "mine"
              ? () => router.push("/citizen/reports/new")
              : undefined
          }
        />
      )}

      {/* Report List - Grid on Desktop, Stack on Mobile */}
      {allReports.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {allReports.map((report) => (
            <ReportCard key={report.id} report={report} />
          ))}

          {/* Infinite Scroll Trigger */}
          <div ref={observerTarget} className="h-4 md:col-span-2 lg:col-span-3" />

          {/* Loading More Indicator */}
          {isLoading && page > 1 && (
            <div className="flex justify-center py-4 md:col-span-2 lg:col-span-3">
              <div className="flex items-center gap-2 text-sm font-body text-muted">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted border-t-blue" />
                <span>Memuat lebih banyak...</span>
              </div>
            </div>
          )}

          {/* End of List */}
          {meta && page >= meta.pages && allReports.length > 0 && (
            <div className="text-center py-4 md:col-span-2 lg:col-span-3">
              <p className="text-sm font-body text-muted">
                Semua laporan telah dimuat
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
