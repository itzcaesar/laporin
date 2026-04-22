// ── components/dashboard/gov/ReportTableMobileCard.tsx ──
"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { cn, formatRelativeTime } from "@/lib/utils";
import type { ReportRow } from "./ReportTable";

type ReportTableMobileCardProps = {
  report: ReportRow;
};

const PRIORITY_COLORS = {
  low: "bg-gray-100 text-gray-700",
  medium: "bg-amber-100 text-amber-700",
  high: "bg-orange-100 text-orange-700",
  urgent: "bg-red-100 text-red-700",
} as const;

const PRIORITY_LABELS = {
  low: "Rendah",
  medium: "Sedang",
  high: "Tinggi",
  urgent: "Darurat",
} as const;

export function ReportTableMobileCard({ report }: ReportTableMobileCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div
      className={cn(
        "rounded-xl bg-white p-4 shadow-sm border border-border",
        report.isHoaxFlagged && "bg-amber-50 border-amber-200"
      )}
    >
      {/* Header: Status + Priority + Category */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-sm font-medium text-ink">{report.status}</span>
        {report.isHoaxFlagged && (
          <span className="text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
            🚫 HOAKS?
          </span>
        )}
        <span
          className={cn(
            "text-xs font-semibold px-2 py-0.5 rounded-full ml-auto",
            PRIORITY_COLORS[report.priority]
          )}
        >
          {PRIORITY_LABELS[report.priority]}
        </span>
        <span className="text-xl">{report.categoryEmoji}</span>
      </div>

      {/* Tracking Code */}
      <Link
        href={`/gov/reports/${report.id}`}
        className="block font-mono text-sm text-blue hover:underline mb-2"
      >
        {report.trackingCode}
      </Link>

      {/* Category Name */}
      <p className="text-sm font-medium text-ink mb-1">{report.categoryName}</p>

      {/* Location */}
      <p className="text-sm text-muted truncate mb-3">
        {report.locationAddress}
      </p>

      {/* PIC + Time */}
      <div className="flex items-center justify-between text-xs text-muted mb-3">
        <span className={cn(!report.picName && "italic")}>
          {report.picName || "Belum ditugaskan"}
        </span>
        <span>{formatRelativeTime(report.createdAt)}</span>
      </div>

      {/* Action Button */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-ink hover:bg-surface transition-colors"
        >
          Aksi
          <ChevronDown
            size={14}
            className={cn(
              "transition-transform",
              isMenuOpen && "rotate-180"
            )}
          />
        </button>

        {/* Dropdown Menu */}
        {isMenuOpen && (
          <>
            <div
              className="fixed inset-0 z-20"
              onClick={() => setIsMenuOpen(false)}
            />
            <div className="absolute left-0 right-0 top-full mt-2 rounded-xl border border-border bg-white shadow-lg z-30 py-1">
              <button className="w-full text-left px-4 py-2.5 text-sm text-ink hover:bg-surface transition-colors">
                Verifikasi
              </button>
              <button className="w-full text-left px-4 py-2.5 text-sm text-ink hover:bg-surface transition-colors">
                Tugaskan PIC
              </button>
              <button className="w-full text-left px-4 py-2.5 text-sm text-ink hover:bg-surface transition-colors">
                Update Status
              </button>
              <button className="w-full text-left px-4 py-2.5 text-sm text-ink hover:bg-surface transition-colors">
                Upload Foto
              </button>
              <hr className="my-1 border-border" />
              <Link
                href={`/gov/reports/${report.id}`}
                className="block px-4 py-2.5 text-sm text-ink hover:bg-surface transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Lihat Detail
              </Link>
              <button className="w-full text-left px-4 py-2.5 text-sm text-ink hover:bg-surface transition-colors">
                Salin Kode
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
