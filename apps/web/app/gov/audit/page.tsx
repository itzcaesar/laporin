// ── app/gov/audit/page.tsx ──
"use client";

import { useState } from "react";
import { AuditTable } from "@/components/dashboard/gov/AuditTable";
import { Pagination } from "@/components/dashboard/shared/Pagination";
import EmptyState from "@/components/dashboard/shared/EmptyState";
import LoadingSkeleton from "@/components/dashboard/shared/LoadingSkeleton";
import { FileText } from "lucide-react";

import { useAudit } from "@/hooks/useAudit";

export default function GovAuditPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [actionFilter, setActionFilter] = useState("all");
  const [dateRange, setDateRange] = useState("all");
  
  const itemsPerPage = 20;
  const { logs, meta, isLoading } = useAudit(currentPage, itemsPerPage);

  // Client-side filtering just for the action since we don't have backend filter yet
  // In a real app, actionFilter should be passed to useAudit and processed by backend
  const filteredLogs = logs.filter((log) => {
    if (actionFilter !== "all" && log.action !== actionFilter) {
      return false;
    }
    return true;
  });

  const totalPages = meta?.pages || 1;

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-display text-navy mb-2">
          Log Audit Aktivitas
        </h1>
        <p className="text-sm text-muted">
          Log audit bersifat permanen dan tidak dapat diubah atau dihapus.
        </p>
      </div>

      {/* Filter Row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
        <div className="flex-shrink-0">
          <label className="block text-xs font-medium text-muted mb-1">
            Filter Aksi
          </label>
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="rounded-lg border border-border bg-white px-3 py-2 text-sm text-ink focus:border-blue focus:outline-none focus:ring-2 focus:ring-blue/20 min-w-[200px]"
          >
            <option value="all">Semua Aksi</option>
            <option value="report.verify">Verifikasi Laporan</option>
            <option value="report.assign">Penugasan PIC</option>
            <option value="report.status_update">Update Status</option>
            <option value="report.media_upload">Upload Foto</option>
            <option value="officer.create">Tambah Petugas</option>
          </select>
        </div>

        <div className="flex-shrink-0">
          <label className="block text-xs font-medium text-muted mb-1">
            Rentang Tanggal
          </label>
          <select
            value={dateRange}
            onChange={(e) => {
              setDateRange(e.target.value);
              setCurrentPage(1);
            }}
            className="rounded-lg border border-border bg-white px-3 py-2 text-sm text-ink focus:border-blue focus:outline-none focus:ring-2 focus:ring-blue/20 min-w-[200px]"
          >
            <option value="all">Semua Waktu</option>
            <option value="today">Hari Ini</option>
            <option value="week">7 Hari Terakhir</option>
            <option value="month">30 Hari Terakhir</option>
          </select>
        </div>
      </div>

      {/* Audit Table */}
      {isLoading ? (
        <LoadingSkeleton variant="table" />
      ) : filteredLogs.length > 0 ? (
        <>
          <AuditTable logs={filteredLogs} />

          {/* Pagination */}
          <div className="mt-4">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={meta?.total || 0}
              onPageChange={setCurrentPage}
            />
          </div>
        </>
      ) : (
        <EmptyState
          icon="📄"
          title="Tidak ada log audit"
          description="Log audit akan muncul di sini setelah ada aktivitas"
        />
      )}
    </div>
  );
}
