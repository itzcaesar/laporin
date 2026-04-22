// ── components/dashboard/gov/ReportTable.tsx ──
"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  ChevronRight,
  MoreVertical,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { cn, formatRelativeTime } from "@/lib/utils";
import { AiSubRow } from "./AiSubRow";

type SortField = "trackingCode" | "status" | "priority" | "createdAt";
type SortDirection = "asc" | "desc";

export type ReportRow = {
  id: string;
  trackingCode: string;
  categoryEmoji: string;
  categoryName: string;
  locationAddress: string;
  status: string;
  priority: "low" | "medium" | "high" | "urgent";
  picName: string | null;
  createdAt: string;
  isHoaxFlagged: boolean;
  aiAnalysis: {
    priorityScore: number;
    priorityLabel: string;
    hoaxConfidence: number;
    hoaxLabel: string;
    dangerLevel: number;
    dangerLabel: string;
    aiSummary: string | null;
  } | null;
};

type ReportTableProps = {
  reports: ReportRow[];
  selectedIds: string[];
  onSelectChange: (ids: string[]) => void;
  onSort?: (field: SortField, direction: SortDirection) => void;
};

const PRIORITY_COLORS = {
  low: "text-gray-600",
  medium: "text-amber-600",
  high: "text-orange-600",
  urgent: "text-red-600",
} as const;

const PRIORITY_LABELS = {
  low: "Rendah",
  medium: "Sedang",
  high: "Tinggi",
  urgent: "Darurat",
} as const;

export function ReportTable({
  reports,
  selectedIds,
  onSelectChange,
  onSort,
}: ReportTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [contextMenuId, setContextMenuId] = useState<string | null>(null);

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === reports.length) {
      onSelectChange([]);
    } else {
      onSelectChange(reports.map((r) => r.id));
    }
  };

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectChange(selectedIds.filter((sid) => sid !== id));
    } else {
      onSelectChange([...selectedIds, id]);
    }
  };

  const handleSort = (field: SortField) => {
    const newDirection =
      sortField === field && sortDirection === "asc" ? "desc" : "asc";
    setSortField(field);
    setSortDirection(newDirection);
    onSort?.(field, newDirection);
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? (
      <ArrowUp size={14} />
    ) : (
      <ArrowDown size={14} />
    );
  };

  return (
    <div className="hidden md:block overflow-x-auto rounded-2xl bg-white shadow-sm border border-border">
      <table className="w-full">
        <thead className="sticky top-16 bg-white border-b border-border z-10">
          <tr>
            <th className="w-12 px-4 py-3">
              <input
                type="checkbox"
                checked={
                  reports.length > 0 && selectedIds.length === reports.length
                }
                onChange={toggleSelectAll}
                className="h-4 w-4 rounded border-gray-300 text-blue focus:ring-blue"
              />
            </th>
            <th className="w-8 px-2 py-3"></th>
            <th
              className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider cursor-pointer hover:text-ink transition-colors"
              onClick={() => handleSort("trackingCode")}
            >
              <div className="flex items-center gap-1">
                Kode
                <SortIcon field="trackingCode" />
              </div>
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">
              Kat
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">
              Lokasi
            </th>
            <th
              className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider cursor-pointer hover:text-ink transition-colors"
              onClick={() => handleSort("status")}
            >
              <div className="flex items-center gap-1">
                Status
                <SortIcon field="status" />
              </div>
            </th>
            <th
              className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider cursor-pointer hover:text-ink transition-colors"
              onClick={() => handleSort("priority")}
            >
              <div className="flex items-center gap-1">
                Pri
                <SortIcon field="priority" />
              </div>
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">
              PIC
            </th>
            <th
              className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider cursor-pointer hover:text-ink transition-colors"
              onClick={() => handleSort("createdAt")}
            >
              <div className="flex items-center gap-1">
                Umur
                <SortIcon field="createdAt" />
              </div>
            </th>
            <th className="w-12 px-4 py-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {reports.map((report) => {
            const isExpanded = expandedRows.has(report.id);
            const isSelected = selectedIds.includes(report.id);

            return (
              <React.Fragment key={report.id}>
                <tr
                  className={cn(
                    "hover:bg-blue-light/30 transition-colors",
                    report.isHoaxFlagged && "bg-amber-50",
                    isSelected && "bg-blue-light/50"
                  )}
                >
                  {/* Checkbox */}
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(report.id)}
                      className="h-4 w-4 rounded border-gray-300 text-blue focus:ring-blue"
                    />
                  </td>

                  {/* Expand Arrow */}
                  <td className="px-2 py-3">
                    <button
                      type="button"
                      onClick={() => toggleRow(report.id)}
                      className="text-muted hover:text-ink transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronDown size={16} />
                      ) : (
                        <ChevronRight size={16} />
                      )}
                    </button>
                  </td>

                  {/* Tracking Code */}
                  <td className="px-4 py-3">
                    <Link
                      href={`/gov/reports/${report.id}`}
                      className="font-mono text-sm text-blue hover:underline"
                    >
                      {report.trackingCode}
                    </Link>
                  </td>

                  {/* Category */}
                  <td className="px-4 py-3">
                    <span className="text-xl" title={report.categoryName}>
                      {report.categoryEmoji}
                    </span>
                  </td>

                  {/* Location */}
                  <td className="px-4 py-3">
                    <span className="text-sm text-ink truncate max-w-[200px] block">
                      {report.locationAddress}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-ink">{report.status}</span>
                      {report.isHoaxFlagged && (
                        <span className="text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                          🚫 HOAKS?
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Priority */}
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "text-sm font-medium",
                        PRIORITY_COLORS[report.priority]
                      )}
                    >
                      {PRIORITY_LABELS[report.priority]}
                    </span>
                  </td>

                  {/* PIC */}
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "text-sm",
                        report.picName ? "text-ink" : "text-muted italic"
                      )}
                    >
                      {report.picName || "Belum ditugaskan"}
                    </span>
                  </td>

                  {/* Age */}
                  <td className="px-4 py-3">
                    <span className="text-sm text-muted">
                      {formatRelativeTime(report.createdAt)}
                    </span>
                  </td>

                  {/* Context Menu */}
                  <td className="px-4 py-3 relative">
                    <button
                      type="button"
                      onClick={() =>
                        setContextMenuId(
                          contextMenuId === report.id ? null : report.id
                        )
                      }
                      className="text-muted hover:text-ink transition-colors"
                    >
                      <MoreVertical size={16} />
                    </button>

                    {contextMenuId === report.id && (
                      <>
                        <div
                          className="fixed inset-0 z-20"
                          onClick={() => setContextMenuId(null)}
                        />
                        <div className="absolute right-0 top-full mt-1 w-48 rounded-xl border border-border bg-white shadow-lg z-30 py-1">
                          <button className="w-full text-left px-4 py-2 text-sm text-ink hover:bg-surface transition-colors">
                            Verifikasi
                          </button>
                          <button className="w-full text-left px-4 py-2 text-sm text-ink hover:bg-surface transition-colors">
                            Tugaskan PIC
                          </button>
                          <button className="w-full text-left px-4 py-2 text-sm text-ink hover:bg-surface transition-colors">
                            Update Status
                          </button>
                          <button className="w-full text-left px-4 py-2 text-sm text-ink hover:bg-surface transition-colors">
                            Upload Foto
                          </button>
                          <hr className="my-1 border-border" />
                          <Link
                            href={`/gov/reports/${report.id}`}
                            className="block px-4 py-2 text-sm text-ink hover:bg-surface transition-colors"
                          >
                            Lihat Detail
                          </Link>
                          <button className="w-full text-left px-4 py-2 text-sm text-ink hover:bg-surface transition-colors">
                            Salin Kode
                          </button>
                        </div>
                      </>
                    )}
                  </td>
                </tr>

                {/* AI Sub-Row */}
                {isExpanded && (
                  <AiSubRow
                    reportId={report.id}
                    analysis={report.aiAnalysis}
                  />
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
