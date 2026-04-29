// ── components/dashboard/gov/DashboardSkeleton.tsx ──
// Loading skeleton for government dashboard

export function DashboardSkeleton() {
  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="h-8 w-64 bg-surface rounded-lg mb-2" />
          <div className="h-4 w-48 bg-surface rounded" />
        </div>
        <div className="h-8 w-32 bg-surface rounded-lg" />
      </div>

      {/* KPI Cards Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-2xl bg-white border border-border p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="h-3 w-24 bg-surface rounded mb-2" />
                <div className="h-8 w-16 bg-surface rounded" />
              </div>
              <div className="w-12 h-12 bg-surface rounded-xl" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
        {/* Main Section Skeleton */}
        <div className="lg:col-span-8 space-y-6">
          {/* Chart Skeleton */}
          <div className="rounded-2xl bg-white border border-border p-6 shadow-sm">
            <div className="h-6 w-48 bg-surface rounded mb-4" />
            <div className="h-[300px] bg-surface rounded-xl" />
          </div>

          {/* Bottom Grid Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div className="rounded-2xl bg-white border border-border p-6 shadow-sm">
              <div className="h-6 w-32 bg-surface rounded mb-4" />
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-surface rounded-xl" />
                ))}
              </div>
            </div>
            <div className="rounded-2xl bg-white border border-border p-6 shadow-sm">
              <div className="h-6 w-32 bg-surface rounded mb-4" />
              <div className="h-[200px] bg-surface rounded-xl" />
            </div>
          </div>
        </div>

        {/* Sidebar Skeleton */}
        <div className="lg:col-span-4 space-y-6">
          <div className="rounded-2xl bg-surface p-6 h-64" />
          <div className="rounded-2xl bg-white border border-border p-6 shadow-sm h-48" />
        </div>
      </div>
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="rounded-2xl bg-white border border-border p-6 shadow-sm animate-pulse">
      <div className="h-6 w-48 bg-surface rounded mb-4" />
      <div className="h-[300px] bg-surface rounded-xl" />
    </div>
  );
}

export function KpiSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="rounded-2xl bg-white border border-border p-5 shadow-sm animate-pulse">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="h-3 w-24 bg-surface rounded mb-2" />
              <div className="h-8 w-16 bg-surface rounded" />
            </div>
            <div className="w-12 h-12 bg-surface rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton() {
  return (
    <div className="rounded-2xl bg-white border border-border p-6 shadow-sm animate-pulse">
      <div className="h-6 w-32 bg-surface rounded mb-4" />
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-16 bg-surface rounded-xl" />
        ))}
      </div>
    </div>
  );
}
