// ── components/map/MapPageClient.tsx ──
"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/Button";

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
            Menampilkan laporan di Buah Batu, Bandung
          </p>
        </div>
      </div>
    ),
  }
);

export function MapPageClient() {
  return (
    <div className="flex h-screen flex-col">
      {/* Top navbar */}
      <header className="shrink-0 border-b border-gray-100 bg-white">
        <div className="flex items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 font-display text-lg font-bold text-navy"
            >
              <div className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-md shadow-sm">
                <Image 
                  src="/icons/icon-192.png" 
                  alt="Laporin Logo" 
                  width={24} 
                  height={24} 
                  className="scale-[1.15] object-cover"
                />
              </div>
              Laporin
            </Link>
            <span className="hidden text-sm text-muted sm:inline">
              / Peta Laporan
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" href="/">
              <span className="hidden sm:inline">← </span>Kembali
            </Button>
            <Button variant="primary" size="sm" href="#lapor">
              <span className="hidden sm:inline">+ </span>Buat Laporan
            </Button>
          </div>
        </div>
      </header>

      {/* Map fills remaining space */}
      <main className="flex-1 overflow-hidden">
        <ReportMap />
      </main>
    </div>
  );
}
