import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Users, Award, Target, Cpu, Smartphone, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Tentang Kami — Laporin",
  description:
    "Informasi tim pengembang dan tujuan Laporin sebagai proyek untuk I/O Fest 2026 Web Development Competition.",
};

const TEAM_MEMBERS = [
  {
    name: "Muhammad Caesar Rifqi",
    role: "Full Stack Developer",
    university: "Telkom University",
    initials: "CR"
  },
  {
    name: "Alessandro Fathi Zulkarnain",
    role: "gapernah kerja, cuman gooning aja",
    university: "Telkom University",
    initials: "AZ"
  },
  {
    name: "Muhammad Fadhil Pratama",
    role: "Researcher & Paper",
    university: "Telkom University",
    initials: "FP"
  },
];

export default function TentangPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-navy via-navy to-blue pb-20">
      {/* Background Decor */}
      <div className="absolute -right-32 -top-32 z-0 h-96 w-96 rounded-full bg-blue/20 blur-3xl" />
      <div className="absolute top-1/2 -left-32 z-0 h-96 w-96 -translate-y-1/2 rounded-full bg-teal/10 blur-3xl" />
      <div className="dot-grid absolute inset-0 z-0 opacity-60" />

      {/* ── Top Bar ── */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-navy/80 backdrop-blur-xl">
        <div className="relative mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-semibold text-white/70 transition-colors hover:text-white z-10"
          >
            <ArrowLeft size={18} />
            <span className="hidden sm:inline">Kembali ke Beranda</span>
          </Link>
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <h1 className="whitespace-nowrap font-display text-base font-bold text-white sm:text-lg">
              Tentang Laporin
            </h1>
          </div>
          <div className="w-10 sm:w-36" /> {/* dummy spacer */}
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-4 pt-12 sm:px-6 md:pt-16 lg:px-8 lg:pt-20">

        {/* Header Title */}
        <div className="mb-12 text-center sm:mb-16">
          <div className="mb-4 inline-flex items-center justify-center rounded-full border border-blue-400/30 bg-blue-400/10 px-4 py-1.5 backdrop-blur-sm">
            <span className="font-display text-xs font-semibold uppercase tracking-wider text-blue-300 sm:text-sm">
              Tentang Proyek
            </span>
          </div>
          <h2 className="mb-4 font-display text-3xl font-extrabold leading-tight text-white sm:text-4xl md:text-5xl">
            Membawa Perubahan <br className="hidden sm:block" /> Melalui Civic Tech
          </h2>
          <p className="mx-auto max-w-2xl font-body text-base leading-relaxed text-white/80 sm:text-lg">
            Laporin dirancang untuk memberdayakan warga negara dalam mengawasi dan memperbaiki infrastruktur publik demi kota yang lebih baik.
          </p>
        </div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-6 lg:grid-cols-6 lg:gap-8 auto-rows-min">

          {/* Card 1: Tujuan (col-span-4) */}
          <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-md transition-all hover:bg-white/10 sm:p-8 md:col-span-4 flex flex-col justify-center">
            <div className="absolute -right-10 -top-10 z-0 h-40 w-40 rounded-full bg-blue-400/20 blur-3xl transition-transform duration-500 group-hover:scale-150" />

            <div className="relative z-10">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 text-white shadow-lg">
                <Target size={28} />
              </div>
              <h2 className="mb-4 font-display text-2xl font-bold text-white sm:text-3xl">
                Tujuan & Kegunaan Laporin
              </h2>
              <div className="space-y-4 font-body leading-relaxed text-white/80 sm:text-lg">
                <p>
                  Infrastruktur publik yang memadai adalah tulang punggung kesejahteraan masyarakat. Sayangnya, kerusakan sering dibiarkan berlalu tanpa penanganan karena absennya visibilitas dan sulitnya pelaporan.
                </p>
                <p>
                  <strong className="text-white">Laporin</strong> hadir sebagai platform independen yang memfasilitasi dialog transparan antara masyarakat dan pemerintah daerah. Dengan antarmuka yang intuitif layaknya PWA modern, masyarakat cukup menekan satu tombol, mengunggah titik koordinat beserta foto bukti, dan menyerahkan sisanya pada sistem pelacakan (tracking) kami yang mendesak perbaikan nyata secara terbuka.
                </p>
              </div>
            </div>
          </div>

          {/* Card 2: Tim Pengembang (col-span-2, row-span-1) */}
          <div className="group relative flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-md transition-all hover:bg-white/10 sm:p-8 md:col-span-2 flex flex-col justify-center">
            <div className="absolute -bottom-10 -right-10 z-0 h-40 w-40 rounded-full bg-sky-400/20 blur-3xl transition-transform duration-500 group-hover:scale-150" />

            <div className="relative z-10 flex h-full flex-col">
              <div className="mb-8 flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-lg">
                  <Users size={24} />
                </div>
                <h3 className="font-display text-xl font-bold text-white sm:text-2xl">
                  Tim Pengembang
                </h3>
              </div>

              <div className="flex flex-col flex-grow justify-center gap-4 pb-2">
                {TEAM_MEMBERS.map((member, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 rounded-2xl border border-white/5 bg-white/[0.03] p-4 transition-all duration-300 hover:border-white/20 hover:bg-white/10 hover:shadow-lg"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-white/10 to-white/5 font-display font-bold text-white shadow-inner ring-1 ring-white/20">
                      {member.initials}
                    </div>
                    <div>
                      <h4 className="mb-0.5 font-display text-sm font-bold leading-tight text-white sm:text-base">
                        {member.name}
                      </h4>
                      <p className="mb-1 text-[11px] font-semibold tracking-wide text-cyan-300 uppercase sm:text-xs">
                        {member.role}
                      </p>
                      <p className="text-[11px] text-white/50">
                        {member.university}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Card 3: I/O Fest (col-span-2) */}
          <div className="group relative overflow-hidden rounded-3xl border border-teal-500/20 bg-teal-900/40 p-6 text-white shadow-2xl backdrop-blur-md transition-all hover:bg-teal-900/50 sm:p-8 md:col-span-2 flex flex-col justify-between min-h-[280px]">
            <div className="absolute -left-10 -top-10 z-0 h-40 w-40 rounded-full bg-teal-400/20 blur-3xl transition-transform duration-500 group-hover:scale-150" />
            <div className="relative z-10 flex flex-col h-full">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl border border-amber-400/20 bg-amber-400/10 shadow-inner backdrop-blur-md">
                <Award size={24} className="text-amber-400" />
              </div>
              <h2 className="mb-3 font-display text-xl font-bold sm:text-2xl">
                I/O Fest 2026
              </h2>
              <p className="mb-6 text-sm leading-relaxed text-white/80 xl:text-base flex-grow">
                Submission resmi untuk kompetisi Web Development bergengsi di Indonesia dengan pendekatan <strong className="text-amber-300">Good Governance & Civic Tech</strong>.
              </p>
              <Link
                href="https://github.com/itzcaesar/laporin"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-auto inline-flex w-fit items-center gap-2 rounded-xl bg-white px-5 py-2.5 font-display text-sm font-semibold text-navy shadow-lg transition-transform duration-300 hover:scale-105 hover:bg-gray-100 hover:shadow-xl"
              >
                <ExternalLink size={16} />
                Lihat Repositori
              </Link>
            </div>
          </div>

          {/* Card 4: Tech & AI (col-span-2) */}
          <div className="group relative overflow-hidden rounded-3xl border border-blue-500/20 bg-blue-900/40 p-6 text-white shadow-2xl backdrop-blur-md transition-all hover:bg-blue-900/50 sm:p-8 md:col-span-2 flex flex-col min-h-[280px]">
            <div className="absolute -bottom-10 -right-10 z-0 h-40 w-40 rounded-full bg-blue-400/20 blur-3xl transition-transform duration-500 group-hover:scale-150" />
            <div className="relative z-10 flex flex-col h-full">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl border border-blue-400/20 bg-blue-400/20 shadow-inner backdrop-blur-md">
                <Cpu size={24} className="text-blue-200" />
              </div>
              <h2 className="mb-3 font-display text-xl font-bold sm:text-2xl">
                Modern & Cerdas
              </h2>
              <div className="space-y-3 flex-grow">
                <p className="text-sm leading-relaxed text-blue-100 xl:text-base flex items-start gap-2">
                  <Smartphone className="w-4 h-4 mt-0.5 shrink-0 text-blue-300" />
                  <span>Dibangun dengan <strong>Next.js 16</strong> dan optimalisasi PWA untuk aksesibilitas lintas platform tanpa batas.</span>
                </p>
                <p className="text-sm leading-relaxed text-blue-100 xl:text-base flex items-start gap-2">
                  <Cpu className="w-4 h-4 mt-0.5 shrink-0 text-blue-300" />
                  <span>Memanfaatkan analisis dataset yang didukung <strong>AI</strong> untuk deteksi laporan ganda secara otomatis (Fitur Riset).</span>
                </p>
              </div>
            </div>
          </div>

          {/* Card 5: Keamanan & Privasi (col-span-2) */}
          <div className="group relative overflow-hidden rounded-3xl border border-indigo-500/20 bg-indigo-900/40 p-6 text-white shadow-2xl backdrop-blur-md transition-all hover:bg-indigo-900/50 sm:p-8 md:col-span-2 flex flex-col min-h-[280px]">
            <div className="absolute -left-10 -top-10 z-0 h-40 w-40 rounded-full bg-indigo-400/20 blur-3xl transition-transform duration-500 group-hover:scale-150" />
            <div className="relative z-10 flex flex-col h-full">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl border border-indigo-400/20 bg-indigo-400/20 shadow-inner backdrop-blur-md">
                <ShieldCheck size={24} className="text-indigo-300" />
              </div>
              <h2 className="mb-3 font-display text-xl font-bold sm:text-2xl">
                Privasi Terjamin
              </h2>
              <p className="text-sm leading-relaxed text-indigo-100 xl:text-base flex-grow">
                Identitas pelapor bersifat <strong>rahasia</strong>. Sistem kami menggunakan pengamanan standar industri dan tidak membagikan detail pribadi kepada publik, untuk mencegah intimidasi dari pihak manapun.
              </p>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
