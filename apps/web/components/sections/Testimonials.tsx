// ── components/sections/Testimonials.tsx ──
"use client";

import { useScrollReveal } from "@/hooks/useScrollReveal";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { TestimonialCard } from "@/components/ui/TestimonialCard";
import type { Testimonial } from '@/types/ui';

const TESTIMONIALS_DATA: Testimonial[] = [
  {
    quote:
      "Jalan di depan rumah saya sudah berlubang 2 tahun. Setelah lapor lewat Laporin, 5 hari kemudian sudah diperbaiki. Saya bisa lihat siapa petugasnya dan kapan jadwal perbaikannya. Luar biasa!",
    name: "Siti Nurhaliza",
    role: "Ibu Rumah Tangga",
    location: "Bandung, Jawa Barat",
    rating: 5,
    isGovernment: false,
    initials: "SN",
  },
  {
    quote:
      "Saya suka fitur verifikasinya. Dulu pemerintah bilang sudah diperbaiki, tapi ternyata belum. Sekarang saya bisa cek sendiri dan kasih penilaian. Ini baru transparan.",
    name: "Budi Santoso",
    role: "Mahasiswa",
    location: "Surabaya, Jawa Timur",
    rating: 5,
    isGovernment: false,
    initials: "BS",
  },
  {
    quote:
      "Sebagai kepala bidang di Dinas PU, Laporin membantu kami memprioritaskan perbaikan berdasarkan data, bukan tekanan politik. Laporan sudah ter-klasifikasi otomatis dan ada estimasi anggarannya.",
    name: "Ir. Agus Prasetyo",
    role: "Kabid Pemeliharaan Jalan, Dinas PU",
    location: "Semarang, Jawa Tengah",
    rating: 5,
    isGovernment: true,
    initials: "AP",
  },
] as const;

export function Testimonials() {
  const sectionRef = useScrollReveal<HTMLElement>();

  return (
    <section
      id="testimoni"
      className="section-padding bg-white"
      ref={sectionRef}
    >
      <div className="container-width reveal">
        <SectionHeader
          eyebrow="Testimoni"
          heading="Cerita dari Lapangan"
          subheading="Warga dan pemerintah yang sudah merasakan dampak Laporin."
        />

        {/* Mobile: horizontal scroll | Desktop: grid */}
        <div className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide md:grid md:grid-cols-3 md:overflow-visible md:pb-0">
          {TESTIMONIALS_DATA.map((testimonial) => (
            <TestimonialCard
              key={testimonial.name}
              testimonial={testimonial}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
