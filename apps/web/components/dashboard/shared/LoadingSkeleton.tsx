// ── components/dashboard/shared/LoadingSkeleton.tsx ──
// Premium shimmer skeleton loaders for various UI patterns

import React from 'react'

type SkeletonVariant =
  | 'report-card'
  | 'report-card-horizontal'
  | 'kpi-card'
  | 'table'
  | 'report-detail'
  | 'notification'
  | 'forum-thread'
  | 'forum-reply'
  | 'map-sidebar'
  | 'profile'

interface LoadingSkeletonProps {
  variant: SkeletonVariant
  rows?: number
}

/** Base shimmer block — the building block for all skeletons */
function Shimmer({ className }: { className: string }) {
  return <div className={`skeleton-shimmer rounded ${className}`} />
}

const VARIANTS: Record<SkeletonVariant, () => React.ReactElement> = {
  'report-card': () => (
    <div className="card-base p-4 overflow-hidden">
      {/* Category + status row */}
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <Shimmer className="h-5 w-5 rounded-full" />
          <Shimmer className="h-4 w-24" />
        </div>
        <Shimmer className="h-6 w-20 rounded-full" />
      </div>
      {/* Title */}
      <Shimmer className="h-5 w-3/4 mb-2" />
      {/* Address */}
      <Shimmer className="h-4 w-2/3 mb-4" />
      {/* Footer */}
      <div className="flex justify-between items-center pt-3 border-t border-gray-100">
        <div className="flex gap-3">
          <Shimmer className="h-4 w-10" />
          <Shimmer className="h-4 w-10" />
        </div>
        <Shimmer className="h-4 w-16" />
      </div>
    </div>
  ),

  'report-card-horizontal': () => (
    <div className="card-base p-4 flex gap-4 overflow-hidden">
      <Shimmer className="h-20 w-20 rounded-xl shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex justify-between mb-2">
          <Shimmer className="h-4 w-24" />
          <Shimmer className="h-6 w-20 rounded-full" />
        </div>
        <Shimmer className="h-5 w-3/4 mb-2" />
        <Shimmer className="h-4 w-2/3 mb-3" />
        <div className="flex gap-3">
          <Shimmer className="h-4 w-10" />
          <Shimmer className="h-4 w-10" />
        </div>
      </div>
    </div>
  ),

  'kpi-card': () => (
    <div className="card-base p-6 overflow-hidden">
      <div className="flex justify-between items-start mb-4">
        <div>
          <Shimmer className="h-4 w-28 mb-2" />
          <Shimmer className="h-9 w-16" />
        </div>
        <Shimmer className="h-12 w-12 rounded-xl" />
      </div>
      <div className="flex items-center gap-2">
        <Shimmer className="h-4 w-4 rounded-full" />
        <Shimmer className="h-4 w-24" />
      </div>
    </div>
  ),

  'table': () => (
    <div className="card-base overflow-hidden p-0">
      {/* Header */}
      <div className="flex gap-4 p-4 border-b border-gray-100 bg-gray-50">
        {[40, 60, 120, 80, 60].map((w, i) => (
          <Shimmer key={i} className={`h-4 w-${w === 40 ? '10' : w === 60 ? '16' : w === 120 ? '32' : w === 80 ? '20' : '16'}`} />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex gap-4 p-4 border-b border-gray-100">
          <Shimmer className="h-4 w-24" />
          <Shimmer className="h-4 w-16 rounded-full" />
          <Shimmer className="h-4 flex-1" />
          <Shimmer className="h-4 w-16 rounded-full" />
          <Shimmer className="h-4 w-12" />
        </div>
      ))}
    </div>
  ),

  'report-detail': () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="card-base p-6">
        <div className="flex gap-2 mb-4">
          <Shimmer className="h-6 w-20 rounded-full" />
          <Shimmer className="h-6 w-16 rounded-full" />
        </div>
        <Shimmer className="h-8 w-3/4 mb-3" />
        <div className="flex gap-3 mb-6">
          <Shimmer className="h-4 w-32" />
          <Shimmer className="h-4 w-24" />
          <Shimmer className="h-4 w-20" />
        </div>
        {/* Image */}
        <Shimmer className="h-56 w-full rounded-xl mb-6" />
        {/* Body text */}
        <Shimmer className="h-4 w-full mb-2" />
        <Shimmer className="h-4 w-5/6 mb-2" />
        <Shimmer className="h-4 w-4/6 mb-2" />
        <Shimmer className="h-4 w-3/6" />
      </div>
      {/* Info panel */}
      <div className="card-base p-6 grid grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i}>
            <Shimmer className="h-3 w-16 mb-2" />
            <Shimmer className="h-5 w-24" />
          </div>
        ))}
      </div>
    </div>
  ),

  'notification': () => (
    <div className="p-4 rounded-xl border border-gray-100 bg-white flex gap-4">
      <Shimmer className="h-2.5 w-2.5 rounded-full mt-2 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="flex justify-between">
          <Shimmer className="h-4 w-2/3" />
          <Shimmer className="h-3 w-12" />
        </div>
        <Shimmer className="h-3 w-full" />
        <Shimmer className="h-3 w-4/5" />
        <Shimmer className="h-5 w-20 rounded" />
      </div>
    </div>
  ),

  'forum-thread': () => (
    <div className="card-base p-6">
      {/* Author row */}
      <div className="flex items-center gap-3 mb-5">
        <Shimmer className="h-12 w-12 rounded-full" />
        <div>
          <Shimmer className="h-4 w-32 mb-1" />
          <Shimmer className="h-3 w-20" />
        </div>
      </div>
      {/* Title */}
      <Shimmer className="h-7 w-3/4 mb-4" />
      {/* Meta chips */}
      <div className="flex gap-2 mb-5">
        <Shimmer className="h-6 w-24 rounded-full" />
        <Shimmer className="h-6 w-16 rounded-full" />
        <Shimmer className="h-6 w-20 rounded-full" />
      </div>
      {/* Content */}
      <Shimmer className="h-4 w-full mb-2" />
      <Shimmer className="h-4 w-5/6 mb-2" />
      <Shimmer className="h-4 w-4/6 mb-6" />
      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t border-gray-100">
        <Shimmer className="h-9 w-24 rounded-lg" />
        <Shimmer className="h-9 w-20 rounded-lg" />
        <Shimmer className="h-9 w-20 rounded-lg" />
      </div>
    </div>
  ),

  'forum-reply': () => (
    <div className="card-base p-5">
      <div className="flex items-start gap-3 mb-4">
        <Shimmer className="h-10 w-10 rounded-full shrink-0" />
        <div className="flex-1">
          <Shimmer className="h-4 w-32 mb-1" />
          <Shimmer className="h-3 w-24" />
        </div>
      </div>
      <Shimmer className="h-4 w-full mb-2" />
      <Shimmer className="h-4 w-5/6 mb-4" />
      <div className="flex gap-2">
        <Shimmer className="h-7 w-16 rounded-lg" />
        <Shimmer className="h-7 w-12 rounded-lg" />
      </div>
    </div>
  ),

  'map-sidebar': () => (
    <div className="p-4 space-y-4">
      <Shimmer className="h-6 w-40 mb-2" />
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="p-3 rounded-xl border border-gray-100 bg-white">
          <div className="flex items-start gap-3">
            <Shimmer className="h-8 w-8 rounded-lg shrink-0" />
            <div className="flex-1">
              <Shimmer className="h-4 w-3/4 mb-2" />
              <Shimmer className="h-3 w-1/2 mb-2" />
              <Shimmer className="h-5 w-16 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  ),

  'profile': () => (
    <div className="space-y-6">
      <div className="card-base p-6 flex flex-col sm:flex-row gap-6 items-start">
        <Shimmer className="h-24 w-24 rounded-2xl shrink-0" />
        <div className="flex-1 space-y-3">
          <Shimmer className="h-7 w-48" />
          <Shimmer className="h-4 w-36" />
          <div className="flex gap-3 pt-2">
            <Shimmer className="h-9 w-28 rounded-lg" />
            <Shimmer className="h-9 w-28 rounded-lg" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="card-base p-4 text-center">
            <Shimmer className="h-8 w-12 mx-auto mb-2" />
            <Shimmer className="h-3 w-20 mx-auto" />
          </div>
        ))}
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
