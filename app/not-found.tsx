// ── app/not-found.tsx ──
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-navy via-blue to-teal px-4 text-center overflow-hidden">
      {/* Texture & Background Shapes */}
      <div className="absolute inset-0 z-0 opacity-20 dot-grid" />
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute -left-20 -top-20 h-64 w-64 animate-pulse rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -bottom-32 -right-20 h-80 w-80 animate-pulse rounded-full bg-teal/10 blur-3xl" style={{ animationDelay: "1s" }} />
      </div>

      <div className="relative z-10">
        {/* 404 number */}
        <div className="mb-4 font-display text-[10rem] font-extrabold leading-none text-white/10 sm:text-[14rem]">
          404
        </div>

        {/* Emoji & message */}
        <div className="-mt-16 mb-6 sm:-mt-24">
          <div className="mb-4 text-5xl sm:text-6xl">🏗️</div>
          <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">
            Halaman Tidak Ditemukan
          </h1>
          <p className="mx-auto mt-3 max-w-md text-base leading-relaxed text-white/70">
            Sepertinya infrastruktur halaman ini belum dibangun — atau mungkin
            sudah dilaporkan rusak oleh warga. 😄
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link href="/">
            <Button variant="primary" size="lg">
              ← Kembali ke Beranda
            </Button>
          </Link>
          <Link href="/peta">
            <Button variant="outline-white" size="lg">
              🗺️ Lihat Peta Laporan
            </Button>
          </Link>
        </div>

        {/* Fun footer */}
        <p className="mt-12 text-xs text-white/40">
          Kode error: INF-404 · Laporan otomatis dikirim ke tim Laporin
        </p>
      </div>
    </div>
  );
}
