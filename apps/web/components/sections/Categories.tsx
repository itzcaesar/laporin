// ── components/sections/Categories.tsx ──
"use client";

import { useState } from "react";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { CategoryChip } from "@/components/ui/CategoryChip";
import { Button } from "@/components/ui/Button";
import type { Category } from "@/types";

const CATEGORIES_DATA: Category[] = [
  { id: "roads", emoji: "🛣️", name: "Jalan Rusak", agency: "Dinas PU" },
  { id: "bus-shelters", emoji: "🚏", name: "Halte Bus Rusak", agency: "Dinas Perhubungan" },
  { id: "street-lights", emoji: "💡", name: "Lampu & Jalan", agency: "Dinas PU" },
  { id: "drainage", emoji: "🌊", name: "Saluran Air", agency: "Dinas PU" },
  { id: "illegal-waste", emoji: "🗑️", name: "Sampah Liar", agency: "Dinas LH" },
  { id: "parks", emoji: "🏞️", name: "Fasilitas Taman", agency: "Dinas PU" },
  { id: "traffic-signs", emoji: "🚦", name: "Rambu Lalu Lintas", agency: "Dinas Perhubungan" },
  { id: "sidewalks", emoji: "♿", name: "Trotoar", agency: "Dinas PU" },
  { id: "public-bridges", emoji: "🌉", name: "Jembatan", agency: "Dinas PU" },
  { id: "clean-water", emoji: "💧", name: "Air Bersih", agency: "PDAM" },
  { id: "public-transport", emoji: "🚌", name: "Transportasi Publik", agency: "Dinas Perhubungan" },
  { id: "cables", emoji: "🔌", name: "Kabel Semrawut", agency: "Dinas PU" },
  { id: "flooding", emoji: "🌧️", name: "Banjir & Genangan", agency: "BPBD" },
  { id: "parking", emoji: "🅿️", name: "Parkir Liar", agency: "Dinas Perhubungan" },
  { id: "health", emoji: "🏥", name: "Faskes Pemerintah", agency: "Dinas Kesehatan" },
  { id: "schools", emoji: "🏫", name: "Fasilitas Sekolah", agency: "Dinas Pendidikan" },
  { id: "abandoned", emoji: "🏚️", name: "Bangunan Terbengkalai", agency: "Dinas PU" },
  { id: "wifi", emoji: "📡", name: "WiFi Publik", agency: "Diskominfo" },
  { id: "cctv", emoji: "📹", name: "CCTV Publik", agency: "Diskominfo" },
  { id: "gov-apps", emoji: "📱", name: "Website Usang", agency: "Diskominfo" },
  { id: "hacked-sites", emoji: "🎰", name: "Situs Diretas", agency: "Diskominfo" },
  { id: "railways", emoji: "🚂", name: "Perlintasan Kereta", agency: "Dinas Perhubungan" },
  { id: "ports", emoji: "⚓", name: "Pelabuhan", agency: "Dinas Perhubungan" },
  { id: "hydrants", emoji: "🧯", name: "Alat Pemadam", agency: "Damkar" },
  { id: "bridges-crosswalks", emoji: "🚶", name: "JPO", agency: "Dinas PU" },
] as const;

export function Categories() {
  const sectionRef = useScrollReveal<HTMLElement>();
  const [showAll, setShowAll] = useState(false);

  const visibleCategories = showAll
    ? CATEGORIES_DATA
    : CATEGORIES_DATA.slice(0, 10);

  return (
    <section
      id="kategori"
      className="section-padding bg-surface"
      ref={sectionRef}
    >
      <div className="container-width reveal">
        <SectionHeader
          eyebrow="25 Kategori"
          heading="Semua Jenis Infrastruktur Tercakup"
          subheading="Dari jalan berlubang sampai WiFi publik — laporkan kerusakan infrastruktur apapun di sekitarmu."
        />

        <div className="relative pb-4 sm:pb-0">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {visibleCategories.map((category) => (
              <CategoryChip key={category.id} category={category} />
            ))}
          </div>

          {/* Fading overlay effect when collapsed */}
          {!showAll && (
            <div className="pointer-events-none absolute bottom-0 left-0 h-24 w-full bg-gradient-to-t from-surface to-transparent" />
          )}
        </div>

        <div className="relative z-10 -mt-2 flex justify-center sm:mt-8">
          <Button
            variant="ghost"
            onClick={() => setShowAll(!showAll)}
            className="w-full bg-blue/5 text-blue transition-colors hover:bg-blue/10 sm:w-auto"
          >
            {showAll ? "↑ Sembunyikan Kategori" : "↓ Lihat 15 Kategori Lainnya"}
          </Button>
        </div>
      </div>
    </section>
  );
}
