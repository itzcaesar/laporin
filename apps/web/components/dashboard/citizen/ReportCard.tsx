// ── components/dashboard/citizen/ReportCard.tsx ──
"use client";

import { cn, formatRelativeTime } from "@/lib/utils";
import { getStatusConfig } from "@/lib/status-config";
import { ArrowBigUp, MessageCircle, CheckCircle2, Star } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";
import { useConfetti } from "@/hooks/useConfetti";
import type { Report } from "@/types";

interface ReportCardProps {
  report: Report;
  className?: string;
}

export function ReportCard({ report, className }: ReportCardProps) {
  const statusConfig = getStatusConfig(report.status);
  const { burst } = useConfetti();
  const cardRef = useRef<HTMLAnchorElement>(null);
  const isCompleted =
    report.status === "completed" || report.status === "verified_complete";

  const handleClick = () => {
    if (isCompleted && cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      burst(
        rect.left + rect.width / 2,
        rect.top + rect.height / 2
      );
    }
  };

  return (
    <Link
      ref={cardRef}
      href={`/citizen/reports/${report.id}`}
      onClick={handleClick}
      className={cn(
        "card-base card-interactive p-4 block",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue",
        isCompleted && "border-green-200 bg-gradient-to-br from-white to-green-50/30",
        className
      )}
    >
      {/* Top Row: Category + Status Badge */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-base" aria-hidden="true">
            {report.categoryEmoji}
          </span>
          <span className="text-sm font-semibold font-display text-ink">
            {report.categoryName}
          </span>
        </div>
        <div
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-3 py-1",
            "text-xs font-medium border",
            statusConfig.bg,
            statusConfig.border,
            isCompleted && "animate-bounce-in"
          )}
          style={{ color: statusConfig.textColor }}
        >
          {isCompleted ? (
            <CheckCircle2 size={12} className="text-green-600" />
          ) : (
            <span aria-hidden="true">{statusConfig.emoji}</span>
          )}
          <span>{statusConfig.label}</span>
        </div>
      </div>

      {/* Title */}
      <h3 className="text-base font-semibold font-display text-navy mb-2 line-clamp-1">
        {report.title}
      </h3>

      {/* Address */}
      <p className="text-sm font-body text-muted mb-3 line-clamp-1">
        📍 {report.locationAddress}
      </p>

      {/* PIC + Estimated End */}
      {(report.picName || report.estimatedEnd) && (
        <div className="flex items-center gap-2 text-xs font-body text-muted mb-3">
          {report.picName && (
            <>
              <span>PIC: {report.picName}</span>
              {report.estimatedEnd && <span>·</span>}
            </>
          )}
          {report.estimatedEnd && (
            <span>
              Est. selesai{" "}
              {new Date(report.estimatedEnd).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short",
              })}
            </span>
          )}
        </div>
      )}

      {/* Bottom Row: Upvotes, Comments, Time */}
      <div className="flex items-center justify-between pt-3 border-t border-border">
        <div className="flex items-center gap-3 text-xs font-medium text-muted">
          <div className="flex items-center gap-1">
            <ArrowBigUp size={14} className="text-muted" />
            <span>{report.upvoteCount}</span>
          </div>
          <div className="flex items-center gap-1">
            <MessageCircle size={14} className="text-muted" />
            <span>{report.commentCount}</span>
          </div>
        </div>
        <span className="text-xs font-body text-muted">
          {formatRelativeTime(report.createdAt)}
        </span>
      </div>
      {/* Survey CTA for completed reports */}
      {isCompleted && (
        <div className="mt-3 pt-3 border-t border-green-100">
          <Link
            href={`/citizen/survey/${report.id}`}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center justify-center gap-1.5 w-full rounded-lg bg-amber-50 border border-amber-200 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100 transition-colors"
          >
            <Star size={12} className="fill-amber-400 text-amber-400" />
            Beri Penilaian Layanan
          </Link>
        </div>
      )}
    </Link>
  );
}
