// ── app/gov/audit/page.tsx ──
"use client";

import { useState } from "react";
import { AuditTable } from "@/components/dashboard/gov/AuditTable";
import { Pagination } from "@/components/dashboard/shared/Pagination";
import { EmptyState } from "@/components/dashboard/shared/EmptyState";
import { FileText } from "lucide-react";

type AuditLog = {
  id: string;
  timestamp: string;
  officerName: string;
  action: string;
  actionLabel: string;
  reportId: string | null;
  reportTrackingCode: string | null;
};

// Action labels mapping
const ACTION_LABELS: Record<string, string> = {
  "report.verify": "Verifikasi laporan",
  "report.assign": "Penugasan PIC",
  "report.status_update": "Update status laporan",
  "report.media_upload": "Upload foto",
  "report.timeline_set": "Set timeline & anggaran",
  "report.comment_reply": "Balas komentar warga",
  "officer.create": "Tambah petugas baru",
  "officer.update": "Edit data petugas",
  "officer.deactivate": "Nonaktifkan petugas",
};

// Mock data - replace with API call
const MOCK_AUDIT_LOGS: AuditLog[] = [
  {
    id: "1",
    timestamp: "2028-04-22T18:34:00Z",
    officerName: "Budi Santosa",
    action: "report.status_update",
    actionLabel: ACTION_LABELS["report.status_update"],
    reportId: "1",
    reportTrackingCode: "LP-2026-BDG-00141",
  },
  {
    id: "2",
    timestamp: "2028-04-22T14:34:00Z",
    officerName: "Agus Permana",
    action: "officer.create",
    actionLabel: "Tambah petugas baru",
    reportId: null,
    reportTrackingCode: null,
  },
  {
    id: "3",
    timestamp: "2028-04-22T13:34:00Z",
    officerName: "Budi Santosa",
    action: "report.assign",
    actionLabel: ACTION_LABELS["report.assign"],
    reportId: "2",
    reportTrackingCode: "LP-2026-BDG-00140",
  },
  {
    id: "4",
    timestamp: "2028-04-21T13:34:00Z",
    officerName: "Siti Nurhaliza",
    action: "report.media_upload",
    actionLabel: ACTION_LABELS["report.media_upload"],
    reportId: "3",
    reportTrackingCode: "LP-2026-BDG-00139",
  },
];

export default function GovAuditPage() {
  const [logs] = useState<AuditLog[]>(MOCK_AUDIT_LOGS);
  const [currentPage, setCurrentPage] = useState(1);
  const [actionFilter, setActionFilter] = useState("all");
  const [dateRange, setDateRange] = useState("all");

  const itemsPerPage = 20;

  // Filter logs
  const filteredLogs = logs.filter((log) => {
    if (actionFilter !== "all" && log.action !== actionFilter) {
      return false;
    }
    // Add date range filtering here if needed
    return true;
  });

  // Pagination
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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
      {paginatedLogs.length > 0 ? (
        <>
          <AuditTable logs={paginatedLogs} />

          {/* Pagination */}
          <div className="mt-4">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredLogs.length}
              onPageChange={setCurrentPage}
            />
          </div>
        </>
      ) : (
        <EmptyState
          icon={FileText}
          title="Tidak ada log audit"
          description="Log audit akan muncul di sini setelah ada aktivitas"
        />
      )}
    </div>
  );
}
