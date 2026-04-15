// ── components/dashboard/shared/LoadingSkeleton.tsx ──
"use client";

import { cn } from "@/lib/utils";

interface LoadingSkeletonProps {
  variant?: "report-card" | "kpi-card" | "table-row" | "notification";
  count?: number;
  className?: string;
}

export function LoadingSkeleton({
  variant = "report-card",
  count = 1,
  className,
}: LoadingSkeletonProps) {
  const items = Array.from({ length: count }, (_, i) => i);

  return (
    <>
      {items.map((i) => (
        <div key={i} className={cn("animate-pulse", className)}>
          {variant === "report-card" && <ReportCardSkeleton />}
          {variant === "kpi-card" && <KpiCardSkeleton />}
          {variant === "table-row" && <TableRowSkeleton />}
          {variant === "notification" && <NotificationSkeleton />}
        </div>
      ))}
    </>
  );
}

function ReportCardSkeleton() {
  return (
    <div className="card-base p-4 space-y-3">
      {/* Category + Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 bg-surface rounded" />
          <div className="h-4 w-24 bg-surface rounded" />
        </div>
        <div className="h-6 w-20 bg-surface rounded-full" />
      </div>

      {/* Address */}
      <div className="h-4 w-3/4 bg-surface rounded" />

      {/* PIC + Date */}
      <div className="flex items-center gap-2 text-xs">
        <div className="h-3 w-32 bg-surface rounded" />
        <div className="h-3 w-24 bg-surface rounded" />
      </div>

      {/* Bottom row */}
      <div className="flex items-center justify-between pt-2 border-t border-border">
        <div className="flex items-center gap-3">
          <div className="h-3 w-12 bg-surface rounded" />
          <div className="h-3 w-12 bg-surface rounded" />
        </div>
        <div className="h-3 w-16 bg-surface rounded" />
      </div>
    </div>
  );
}

function KpiCardSkeleton() {
  return (
    <div className="card-base p-6 space-y-3">
      <div className="h-8 w-16 bg-surface rounded" />
      <div className="h-4 w-24 bg-surface rounded" />
      <div className="h-3 w-20 bg-surface rounded" />
    </div>
  );
}

function TableRowSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 border-b border-border">
      <div className="h-4 w-4 bg-surface rounded" />
      <div className="h-4 w-24 bg-surface rounded" />
      <div className="h-4 w-32 bg-surface rounded" />
      <div className="h-4 w-40 bg-surface rounded" />
      <div className="h-6 w-20 bg-surface rounded-full" />
      <div className="h-4 w-16 bg-surface rounded" />
    </div>
  );
}

function NotificationSkeleton() {
  return (
    <div className="flex items-start gap-3 p-4 border-b border-border">
      <div className="h-2 w-2 bg-surface rounded-full mt-2" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-3/4 bg-surface rounded" />
        <div className="h-3 w-1/4 bg-surface rounded" />
      </div>
    </div>
  );
}
