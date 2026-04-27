// ── app/citizen/page.tsx ──
// Citizen home/feed page with report list and filters

"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useReports } from "@/hooks/useReports";
import { FilterChips } from "@/components/dashboard/shared/FilterChips";
import EmptyState from "@/components/dashboard/shared/EmptyState";
import LoadingSkeleton from "@/components/dashboard/shared/LoadingSkeleton";
import { ReportCard } from "@/components/dashboard/citizen/ReportCard";
import { ReportFeed } from "@/components/dashboard/citizen/ReportFeed";
import type { ReportStatus } from '@laporin/types';

const FILTER_OPTIONS = [
  { label: "Semua", value: "" },
  { label: "Baru", value: "new" },
  { label: "Diverifikasi", value: "verified" },
  { label: "Diproses", value: "in_progress" },
  { label: "Selesai", value: "completed" },
  { label: "Terverifikasi", value: "verified_complete" },
];

export default function CitizenHomePage() {
  const searchParams = useSearchParams();
  const [activeFilter, setActiveFilter] = useState<ReportStatus | "">("");
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");

  // Fetch reports with current filter
  const { reports, isLoading, error, refetch } = useReports({
    status: activeFilter || undefined,
    search: searchQuery || undefined,
  });

  // Listen for filter changes from topbar
  useEffect(() => {
    const handleFilterChange = (e: CustomEvent) => {
      const value = e.detail;
      // Map old filter values to new status values
      const statusMap: Record<string, ReportStatus | ""> = {
        all: "",
        baru: "new",
        diverifikasi: "verified",
        diproses: "in_progress",
        selesai: "completed",
        terverifikasi: "verified_complete",
      };
      setActiveFilter(statusMap[value] ?? "");
    };
    window.addEventListener('filterChange', handleFilterChange as EventListener);
    return () => {
      window.removeEventListener('filterChange', handleFilterChange as EventListener);
    };
  }, []);

  const handleFilterChange = (value: string) => {
    setActiveFilter(value as ReportStatus | "");
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

      {/* Filter Chips - Desktop/Tablet only */}
      <div className="hidden md:block">
        <FilterChips
          options={FILTER_OPTIONS}
          active={activeFilter}
          onChange={handleFilterChange}
          className="mb-6"
        />
      </div>

      {/* Loading State */}
      {isLoading && (
        <>
          <div className="hidden md:block">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <LoadingSkeleton key={i} variant="report-card" />
              ))}
            </div>
          </div>
          <div className="md:hidden space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <LoadingSkeleton key={i} variant="report-card" />
            ))}
          </div>
        </>
      )}

      {/* Error State */}
      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-red-700 text-sm">
          {error}
          <button onClick={refetch} className="ml-2 underline font-medium">
            Coba lagi
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && reports.length === 0 && (
        <EmptyState
          icon="📄"
          title="Tidak ada laporan"
          description={
            searchQuery
              ? `Tidak ada laporan yang cocok dengan "${searchQuery}"`
              : activeFilter
              ? "Tidak ada laporan dengan status ini."
              : "Belum ada laporan di area ini. Jadilah yang pertama melaporkan!"
          }
          action={
            !searchQuery && !activeFilter
              ? { label: "Buat Laporan Pertama", href: "/citizen/reports/new" }
              : undefined
          }
        />
      )}

      {/* Report List - Grid on Desktop, Stack on Mobile */}
      {!isLoading && !error && reports.length > 0 && (
        <>
          {/* Desktop/Tablet: Card Grid with count */}
          <div className="hidden md:block">
            <div className="mb-4 text-sm text-muted">
              Menampilkan {reports.length} laporan
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {reports.map((report) => (
                <ReportCard key={report.id} report={report} />
              ))}
            </div>
          </div>

          {/* Mobile: IG-style Feed (no count) */}
          <div className="md:hidden">
            <ReportFeed reports={reports} />
          </div>
        </>
      )}
    </div>
  );
}
