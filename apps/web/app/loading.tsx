// ── app/loading.tsx ──
// Global page transition skeleton — uses shimmer instead of spinners
export default function Loading() {
  return (
    <div className="flex h-screen w-full flex-col bg-surface">
      {/* Skeleton Navbar */}
      <div className="flex shrink-0 items-center justify-between border-b border-gray-100 bg-white px-4 py-3 sm:px-6">
        <div className="skeleton-shimmer h-8 w-32 rounded" />
        <div className="flex gap-3">
          <div className="skeleton-shimmer hidden h-9 w-24 rounded sm:block" />
          <div className="skeleton-shimmer h-9 w-32 rounded" />
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Skeleton Sidebar */}
        <div className="hidden h-full w-[220px] shrink-0 flex-col border-r border-gray-100 bg-white p-4 gap-2 md:flex">
          <div className="skeleton-shimmer h-8 w-3/4 rounded-lg mb-4" />
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-2 py-2">
              <div className="skeleton-shimmer h-5 w-5 rounded" />
              <div className="skeleton-shimmer h-4 flex-1 rounded" />
            </div>
          ))}
        </div>

        {/* Skeleton Main Content */}
        <div className="flex-1 p-6 overflow-auto">
          {/* Page header */}
          <div className="mb-6">
            <div className="skeleton-shimmer h-8 w-48 rounded mb-2" />
            <div className="skeleton-shimmer h-4 w-72 rounded" />
          </div>

          {/* KPI cards row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-gray-100 bg-white p-5">
                <div className="flex justify-between items-start mb-3">
                  <div className="skeleton-shimmer h-4 w-20 rounded" />
                  <div className="skeleton-shimmer h-10 w-10 rounded-xl" />
                </div>
                <div className="skeleton-shimmer h-8 w-14 rounded mb-2" />
                <div className="skeleton-shimmer h-3 w-24 rounded" />
              </div>
            ))}
          </div>

          {/* Content cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-gray-100 bg-white p-4">
                <div className="flex justify-between mb-3">
                  <div className="skeleton-shimmer h-5 w-1/3 rounded" />
                  <div className="skeleton-shimmer h-5 w-20 rounded-full" />
                </div>
                <div className="skeleton-shimmer h-5 w-3/4 rounded mb-2" />
                <div className="skeleton-shimmer h-4 w-2/3 rounded mb-4" />
                <div className="flex justify-between pt-3 border-t border-gray-50">
                  <div className="skeleton-shimmer h-4 w-16 rounded" />
                  <div className="skeleton-shimmer h-4 w-20 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
