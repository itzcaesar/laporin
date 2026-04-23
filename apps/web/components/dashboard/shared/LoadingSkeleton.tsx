// ── components/dashboard/shared/LoadingSkeleton.tsx ──
// Standard loading skeleton component for various UI patterns

type SkeletonVariant = 'report-card' | 'kpi-card' | 'table' | 'report-detail' | 'notification'

interface LoadingSkeletonProps {
  variant: SkeletonVariant
  rows?: number   // for table variant
}

const VARIANTS: Record<SkeletonVariant, () => React.ReactElement> = {
  'report-card': () => (
    <div className="card-base p-4 animate-pulse">
      <div className="flex justify-between mb-3">
        <div className="h-5 bg-gray-200 rounded w-1/3" />
        <div className="h-5 bg-gray-200 rounded w-20" />
      </div>
      <div className="h-4 bg-gray-200 rounded w-2/3 mb-2" />
      <div className="h-4 bg-gray-200 rounded w-1/2" />
    </div>
  ),
  'kpi-card': () => (
    <div className="card-base p-6 animate-pulse">
      <div className="h-10 w-10 bg-gray-200 rounded-full mb-4" />
      <div className="h-8 bg-gray-200 rounded w-20 mb-2" />
      <div className="h-4 bg-gray-200 rounded w-24" />
    </div>
  ),
  'table': () => (
    <div className="card-base overflow-hidden animate-pulse">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="flex gap-4 p-4 border-b border-border">
          <div className="h-4 bg-gray-200 rounded w-32" />
          <div className="h-4 bg-gray-200 rounded w-24" />
          <div className="h-4 bg-gray-200 rounded flex-1" />
          <div className="h-4 bg-gray-200 rounded w-20" />
        </div>
      ))}
    </div>
  ),
  'report-detail': () => (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-1/2" />
      <div className="h-48 bg-gray-200 rounded-2xl" />
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded" />
        <div className="h-4 bg-gray-200 rounded w-5/6" />
        <div className="h-4 bg-gray-200 rounded w-4/6" />
      </div>
    </div>
  ),
  'notification': () => (
    <div className="flex gap-3 p-4 animate-pulse">
      <div className="h-2 w-2 bg-gray-200 rounded-full mt-2 flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
      </div>
    </div>
  ),
}

export default function LoadingSkeleton({ variant, rows = 1 }: LoadingSkeletonProps) {
  const Skeleton = VARIANTS[variant]
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} />
      ))}
    </>
  )
}
