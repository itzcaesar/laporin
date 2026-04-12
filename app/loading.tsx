// ── app/loading.tsx ──
export default function Loading() {
  return (
    <div className="flex h-screen w-full flex-col bg-surface">
      {/* Skeleton Navbar */}
      <div className="flex shrink-0 animate-pulse items-center justify-between border-b border-gray-100 bg-white px-4 py-3 sm:px-6">
        <div className="h-8 w-32 rounded bg-gray-200" />
        <div className="flex gap-3">
          <div className="hidden h-9 w-24 rounded bg-gray-100 sm:block" />
          <div className="h-9 w-32 rounded bg-blue-light" />
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Skeleton Sidebar (hidden on mobile, visible on desktop) */}
        <div className="hidden h-full w-[380px] shrink-0 animate-pulse flex-col border-r border-gray-100 bg-white p-4 md:flex">
          <div className="mb-4 flex items-center justify-between">
            <div className="h-6 w-32 rounded bg-gray-200" />
            <div className="h-6 w-16 rounded-full bg-blue-light" />
          </div>
          
          <div className="mb-6 flex gap-2">
            <div className="h-8 w-16 rounded-lg bg-gray-200" />
            <div className="h-8 w-20 rounded-lg bg-gray-100" />
            <div className="h-8 w-24 rounded-lg bg-gray-100" />
          </div>

          <div className="flex-1 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-32 w-full rounded-xl border border-gray-100 p-4">
                <div className="mb-3 flex justify-between">
                  <div className="h-4 w-1/2 rounded bg-gray-200" />
                  <div className="h-4 w-16 rounded-full bg-gray-200" />
                </div>
                <div className="mb-2 h-3 w-full rounded bg-gray-100" />
                <div className="mb-4 h-3 w-2/3 rounded bg-gray-100" />
                <div className="flex justify-between">
                  <div className="h-3 w-1/3 rounded bg-gray-100" />
                  <div className="h-3 w-1/4 rounded bg-gray-100" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Skeleton Main Area (Map/Content) */}
        <div className="flex flex-1 animate-pulse flex-col items-center justify-center bg-gray-50 bg-opacity-50">
          <div className="flex flex-col items-center">
            <div className="mb-4 h-16 w-16 animate-bounce rounded-full border-4 border-white bg-blue opacity-50 shadow-lg" />
            <div className="h-4 w-32 rounded bg-gray-200" />
          </div>
        </div>
      </div>
    </div>
  );
}
