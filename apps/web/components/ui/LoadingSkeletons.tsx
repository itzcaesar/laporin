// ── components/ui/LoadingSkeletons.tsx ──
// Standardized loading skeleton components

import { cn } from "@/lib/utils";

/**
 * Base skeleton component
 */
export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-lg bg-gray-200", className)}
      {...props}
    />
  );
}

/**
 * Card skeleton for dashboard cards
 */
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-2xl bg-white p-6 shadow-sm border border-border",
        className
      )}
    >
      <div className="space-y-3 animate-pulse">
        <div className="h-10 w-10 rounded-full bg-gray-200" />
        <div className="h-4 w-24 rounded bg-gray-200" />
        <div className="h-8 w-32 rounded bg-gray-200" />
      </div>
    </div>
  );
}

/**
 * KPI card skeleton
 */
export function KpiCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-2xl bg-white p-6 shadow-sm border border-border",
        className
      )}
    >
      <div className="space-y-3 animate-pulse">
        <div className="h-10 w-10 rounded-full bg-gray-200" />
        <div className="h-4 w-24 rounded bg-gray-200" />
        <div className="h-8 w-32 rounded bg-gray-200" />
        <div className="h-3 w-20 rounded bg-gray-200" />
      </div>
    </div>
  );
}

/**
 * Chart skeleton
 */
export function ChartSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-2xl bg-white p-6 shadow-sm border border-border",
        className
      )}
    >
      <div className="space-y-4 animate-pulse">
        <div className="h-6 w-32 rounded bg-gray-200" />
        <div className="h-[280px] rounded bg-gray-100" />
      </div>
    </div>
  );
}

/**
 * Table row skeleton
 */
export function TableRowSkeleton() {
  return (
    <tr className="animate-pulse">
      <td className="px-4 py-3">
        <div className="h-4 w-24 rounded bg-gray-200" />
      </td>
      <td className="px-4 py-3">
        <div className="h-4 w-32 rounded bg-gray-200" />
      </td>
      <td className="px-4 py-3">
        <div className="h-4 w-20 rounded bg-gray-200" />
      </td>
      <td className="px-4 py-3">
        <div className="h-4 w-16 rounded bg-gray-200" />
      </td>
      <td className="px-4 py-3">
        <div className="h-4 w-24 rounded bg-gray-200" />
      </td>
    </tr>
  );
}

/**
 * Report card skeleton
 */
export function ReportCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-xl bg-white p-4 shadow-sm border border-border",
        className
      )}
    >
      <div className="space-y-3 animate-pulse">
        <div className="flex items-start gap-3">
          <div className="h-16 w-16 rounded-lg bg-gray-200" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-3/4 rounded bg-gray-200" />
            <div className="h-3 w-1/2 rounded bg-gray-200" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-6 w-16 rounded-full bg-gray-200" />
          <div className="h-6 w-20 rounded-full bg-gray-200" />
        </div>
      </div>
    </div>
  );
}

/**
 * List skeleton
 */
export function ListSkeleton({
  count = 3,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="flex items-center gap-3 rounded-lg bg-white p-4 border border-border">
            <div className="h-12 w-12 rounded-full bg-gray-200" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 rounded bg-gray-200" />
              <div className="h-3 w-1/2 rounded bg-gray-200" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Text skeleton
 */
export function TextSkeleton({
  lines = 3,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2 animate-pulse", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 rounded bg-gray-200"
          style={{
            width: i === lines - 1 ? "60%" : "100%",
          }}
        />
      ))}
    </div>
  );
}

/**
 * Avatar skeleton
 */
export function AvatarSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "h-10 w-10 rounded-full bg-gray-200 animate-pulse",
        className
      )}
    />
  );
}

/**
 * Button skeleton
 */
export function ButtonSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "h-10 w-24 rounded-lg bg-gray-200 animate-pulse",
        className
      )}
    />
  );
}

/**
 * Badge skeleton
 */
export function BadgeSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "h-6 w-16 rounded-full bg-gray-200 animate-pulse",
        className
      )}
    />
  );
}

/**
 * Image skeleton
 */
export function ImageSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "aspect-video w-full rounded-lg bg-gray-200 animate-pulse",
        className
      )}
    />
  );
}

/**
 * Map skeleton
 */
export function MapSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "h-full w-full bg-gray-100 animate-pulse flex items-center justify-center",
        className
      )}
    >
      <div className="text-center space-y-3">
        <div className="h-12 w-12 rounded-full bg-gray-200 mx-auto" />
        <div className="h-4 w-32 rounded bg-gray-200 mx-auto" />
      </div>
    </div>
  );
}

/**
 * Form skeleton
 */
export function FormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2 animate-pulse">
          <div className="h-4 w-24 rounded bg-gray-200" />
          <div className="h-10 w-full rounded-lg bg-gray-200" />
        </div>
      ))}
    </div>
  );
}

/**
 * Page skeleton
 */
export function PageSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <div className="space-y-3 animate-pulse">
        <div className="h-8 w-48 rounded bg-gray-200" />
        <div className="h-4 w-64 rounded bg-gray-200" />
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <KpiCardSkeleton key={i} />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>
    </div>
  );
}

/**
 * Dashboard skeleton
 */
export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2 animate-pulse">
        <div className="h-8 w-64 rounded bg-gray-200" />
        <div className="h-4 w-96 rounded bg-gray-200" />
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <KpiCardSkeleton key={i} />
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white shadow-sm border border-border overflow-hidden">
        <div className="p-6 space-y-4">
          <div className="h-6 w-32 rounded bg-gray-200 animate-pulse" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 rounded bg-gray-100 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
