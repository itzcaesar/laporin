// ── components/dashboard/gov/AuditTable.tsx ──
"use client";

import Link from "next/link";

type AuditLog = {
  id: string;
  timestamp: string;
  officerName: string;
  action: string;
  actionLabel: string;
  reportId: string | null;
  reportTrackingCode: string | null;
};

type AuditTableProps = {
  logs: AuditLog[];
};

export function AuditTable({ logs }: AuditTableProps) {
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  return (
    <div className="overflow-x-auto rounded-2xl bg-white shadow-sm border border-border">
      <table className="w-full min-w-[800px]">
        <thead className="border-b border-border bg-surface">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider w-[200px]">
              Waktu
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider w-[180px]">
              Petugas
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">
              Aksi
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider w-[200px]">
              Laporan Terkait
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {logs.map((log) => (
            <tr key={log.id} className="hover:bg-blue-light/20 transition-colors">
              {/* Timestamp */}
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="text-sm text-ink">
                  {formatTimestamp(log.timestamp)}
                </span>
              </td>

              {/* Officer */}
              <td className="px-6 py-4">
                <span className="text-sm font-medium text-ink">
                  {log.officerName}
                </span>
              </td>

              {/* Action */}
              <td className="px-6 py-4">
                <span className="text-sm text-ink">{log.actionLabel}</span>
              </td>

              {/* Related Report */}
              <td className="px-6 py-4 whitespace-nowrap">
                {log.reportId && log.reportTrackingCode ? (
                  <Link
                    href={`/gov/reports/${log.reportId}`}
                    className="font-mono text-sm text-blue hover:underline"
                  >
                    {log.reportTrackingCode}
                  </Link>
                ) : (
                  <span className="text-sm text-muted">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
