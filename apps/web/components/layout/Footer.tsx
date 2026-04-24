// ── components/layout/Footer.tsx ──
import Link from "next/link";
import Image from "next/image";
import { Globe, ExternalLink, GitFork } from "lucide-react";
import type { FooterColumn } from "@/types";

const FOOTER_COLUMNS: FooterColumn[] = [
  {
    heading: "Platform",
    links: [
      { label: "Buat Laporan", href: "/lapor" },
      { label: "Peta Laporan", href: "/peta" },
      { label: "Cara Kerja", href: "/#cara-kerja" },
      { label: "Statistik", href: "/#statistik" },
    ],
  },
  {
    heading: "Kategori",
    links: [
      { label: "Jalan Rusak", href: "/lapor" },
      { label: "Lampu Jalan", href: "/lapor" },
      { label: "Drainase", href: "/lapor" },
      { label: "Lihat Semua →", href: "/lapor" },
    ],
  },
  {
    heading: "Kontak",
    links: [
      { label: "halo@Laporin.site", href: "mailto:halo@Laporin.site" },
      { label: "Panduan Pengguna", href: "/#panduan" },
      { label: "FAQ", href: "/#faq" },
      { label: "Kebijakan Privasi", href: "/privasi" },
    ],
  },
] as const;

const SOCIAL_LINKS = [
  { icon: Globe, label: "Twitter / X", href: "https://twitter.com/Laporin" },
  { icon: ExternalLink, label: "Instagram", href: "https://instagram.com/Laporin" },
  { icon: GitFork, label: "GitHub", href: "https://github.com/Laporin" },
] as const;

export function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-white">
      <div className="container-width px-4 py-8 sm:py-12 sm:px-6 lg:px-8">
        <div className="grid gap-6 grid-cols-2 sm:gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand column */}
          <div className="lg:col-span-1">
            <Link
              href="/"
              className="mb-4 flex items-center gap-2 font-display text-xl font-bold text-navy"
            >
              <div className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-md shadow-sm">
                <Image
                  src="/icons/icon-192.png"
                  alt="Laporin Logo"
                  width={28}
                  height={28}
                  className="scale-[1.15] object-cover"
                />
              </div>
              Laporin
            </Link>
            <p className="mb-6 text-sm leading-relaxed text-muted">
              Platform pelaporan infrastruktur publik yang menghubungkan warga
              dengan pemerintah daerah — transparan, akuntabel, dan didukung AI.
            </p>

            {/* Social links */}
            <div className="flex gap-3">
              {SOCIAL_LINKS.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-50 text-muted transition-all duration-200 hover:bg-navy hover:text-white min-h-[44px] min-w-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue"
                  >
                    <Icon size={18} />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Link columns */}
          {FOOTER_COLUMNS.map((column) => (
            <div key={column.heading}>
              <h3 className="mb-4 font-display text-sm font-bold uppercase tracking-wider text-navy">
                {column.heading}
              </h3>
              <ul className="space-y-3">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted transition-colors duration-200 hover:text-navy"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 border-t border-gray-100 pt-6">
          <div className="flex flex-col items-center gap-2 text-center text-xs text-muted sm:flex-row sm:justify-between sm:text-left">
            <p>© 2026 Laporin. Hak cipta dilindungi.</p>
            <p>
              I/O Fest 2026 · Civic Technology · Platform non-komersial
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
