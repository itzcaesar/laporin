// ── components/layout/Navbar.tsx ──
"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useScrolled } from "@/hooks/useScrolled";
import { Button } from "@/components/ui/Button";
import type { NavLink } from "@/types";

const NAV_LINKS: NavLink[] = [
  { label: "Cara Kerja", href: "#cara-kerja" },
  { label: "Fitur", href: "#fitur" },
  { label: "Kategori", href: "#kategori" },
  { label: "Statistik", href: "#statistik" },
  { label: "Testimoni", href: "#testimoni" },
] as const;

export function Navbar() {
  const isScrolled = useScrolled(50);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleMenuToggle = () => {
    setIsMenuOpen((prev) => !prev);
  };

  const isWhiteNav = isScrolled && !isMenuOpen;

  return (
    <nav
      className={cn(
        "fixed left-4 right-4 top-4 z-50 mx-auto max-w-7xl overflow-hidden rounded-2xl transition-all duration-300",
        isMenuOpen
          ? "bg-navy shadow-2xl"
          : isScrolled
            ? "border border-gray-100 bg-white/95 shadow-xl backdrop-blur-md"
            : "bg-transparent"
      )}
    >
      <div className="container-width flex items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 font-display text-xl font-bold"
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
          <span className={cn(isWhiteNav ? "text-navy" : "text-white")}>
            Laporin
          </span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue",
                isWhiteNav
                  ? "text-muted hover:bg-gray-50 hover:text-navy"
                  : "text-white/80 hover:bg-white/10 hover:text-white"
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Desktop CTA buttons */}
        <div className="hidden items-center gap-3 md:flex">
          <Button
            variant={isWhiteNav ? "ghost" : "outline-white"}
            size="sm"
            href="#masuk"
          >
            Masuk
          </Button>
          <Button
            variant="primary"
            size="sm"
            href="#lapor"
          >
            Buat Laporan
          </Button>
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={handleMenuToggle}
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-lg md:hidden",
            "min-h-[44px] min-w-[44px]",
            "transition-colors duration-200",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue",
            isWhiteNav
              ? "text-navy hover:bg-gray-50"
              : "text-white hover:bg-white/10"
          )}
          aria-label={isMenuOpen ? "Tutup menu" : "Buka menu"}
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile drawer */}
      {isMenuOpen && (
        <div className="animate-slide-down border-t border-white/10 bg-navy px-4 pb-6 pt-2 md:hidden">
          <div className="space-y-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMenuOpen(false)}
                className="block rounded-lg px-4 py-3 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white min-h-[44px] flex items-center"
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div className="mt-4 flex flex-col gap-3">
            <Button variant="outline-white" size="md" href="#masuk" className="w-full">
              Masuk
            </Button>
            <Button
              variant="primary"
              size="md"
              href="#lapor"
              className="w-full"
            >
              Buat Laporan
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
}
