// ── components/sections/Categories.tsx ──
"use client";

import { useScrollReveal } from "@/hooks/useScrollReveal";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { CategoryChip } from "@/components/ui/CategoryChip";
import type { Category } from "@/types";

const CATEGORIES_DATA: Category[] = [
  { id: "roads", emoji: "🛣️", name: "Jalan Rusak", agency: "Dinas PU" },
  { id: "bus-shelters", emoji: "🚏", name: "Halte Bus Rusak", agency: "Dinas Perhubungan" },
  { id: "street-lights", emoji: "💡", name: "Lampu Lalu Lintas & Jalan", agency: "Dinas PU" },
  { id: "traffic-signs", emoji: "🚦", name: "Rambu Lalu Lintas", agency: "Dinas Perhubungan" },
  { id: "sidewalks", emoji: "♿", name: "Trotoar & Fasilitas Disabilitas", agency: "Dinas PU" },
  { id: "hacked-sites", emoji: "🎰", name: "Website Pemerintah Diretas (Judi)", agency: "Diskominfo" },
  { id: "public-transport", emoji: "🚌", name: "Transportasi Publik", agency: "Dinas Perhubungan" },
  { id: "bridges-crosswalks", emoji: "🚶", name: "Jembatan Penyeberangan", agency: "Dinas PU" },
  { id: "cables", emoji: "🔌", name: "Jaringan Kabel Semrawut", agency: "Dinas PU" },
  { id: "gov-apps", emoji: "📱", name: "Aplikasi & Website Pemerintah Usang", agency: "Diskominfo" },
  { id: "drainage", emoji: "🌊", name: "Drainase & Saluran Air", agency: "Dinas PU" },
  { id: "public-bridges", emoji: "🌉", name: "Jembatan Umum", agency: "Dinas PU" },
  { id: "clean-water", emoji: "💧", name: "Fasilitas Air Bersih", agency: "PDAM" },
  { id: "illegal-waste", emoji: "🗑️", name: "Pembuangan Sampah Liar", agency: "Dinas LH" },
  { id: "parks", emoji: "🏞️", name: "Taman Kota & Ruang Publik", agency: "Dinas PU" },
  { id: "schools", emoji: "🏫", name: "Fasilitas Sekolah Negeri", agency: "Dinas Pendidikan" },
  { id: "health", emoji: "🏥", name: "Fasilitas Kesehatan Pemerintah", agency: "Dinas Kesehatan" },
  { id: "parking", emoji: "🅿️", name: "Parkir Liar & Marka Jalan", agency: "Dinas Perhubungan" },
  { id: "flooding", emoji: "🌧️", name: "Banjir & Genangan Jalan", agency: "BPBD" },
  { id: "railways", emoji: "🚂", name: "Rel Kereta & Perlintasan", agency: "Dinas Perhubungan" },
  { id: "ports", emoji: "⚓", name: "Pelabuhan & Dermaga", agency: "Dinas Perhubungan" },
  { id: "wifi", emoji: "📡", name: "WiFi Publik Pemerintah", agency: "Diskominfo" },
  { id: "abandoned", emoji: "🏚️", name: "Bangunan Pemerintah Terbengkalai", agency: "Dinas PU" },
  { id: "cctv", emoji: "📹", name: "CCTV Publik Rusak", agency: "Diskominfo" },
  { id: "hydrants", emoji: "🧯", name: "Hidran & Alat Pemadam Kebakaran", agency: "Damkar" },
] as const;

export function Categories() {
  const sectionRef = useScrollReveal<HTMLElement>();

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

        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
          {CATEGORIES_DATA.map((category) => (
            <CategoryChip key={category.id} category={category} />
          ))}
        </div>
      </div>
    </section>
  );
}
