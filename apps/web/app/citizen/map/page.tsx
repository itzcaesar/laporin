// ── app/citizen/map/page.tsx ──
// Citizen map page - reuses the landing page map component

"use client";

import dynamic from "next/dynamic";

const ReportMap = dynamic(
  () =>
    import("@/components/map/ReportMap").then((mod) => ({
      default: mod.ReportMap,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-surface">
        <div className="text-center">
          <div className="mb-3 text-4xl">🗺️</div>
          <p className="font-display text-lg font-semibold text-navy">
            Memuat peta...
          </p>
          <p className="mt-1 text-sm text-muted">
            Menampilkan laporan di area Bandung
          </p>
        </div>
      </div>
    ),
  }
);

export default function CitizenMapPage() {
  return (
    // Full screen map - remove layout padding
    <div className="fixed inset-0 top-16 bottom-0 md:bottom-0">
      <ReportMap />
    </div>
  );
}
