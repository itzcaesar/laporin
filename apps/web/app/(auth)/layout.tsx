// ── app/(auth)/layout.tsx ──
// Full-screen layout for login and register pages

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-navy via-navy to-blue">
      {/* Dot grid texture overlay - same as hero section */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)`,
          backgroundSize: "24px 24px",
        }}
      />

      {/* Back to home button */}
      <Link
        href="/"
        className="absolute left-4 top-4 z-20 flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-medium text-white backdrop-blur-sm transition-all duration-200 hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white min-h-[44px]"
      >
        <ArrowLeft size={16} />
        <span className="hidden sm:inline">Kembali ke Beranda</span>
        <span className="sm:hidden">Beranda</span>
      </Link>

      {/* Content */}
      <div className="relative z-10 flex min-h-screen items-center justify-center p-4">
        {children}
      </div>
    </div>
  );
}
