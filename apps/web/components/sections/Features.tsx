// ── components/sections/Features.tsx ──
"use client";

import { useScrollReveal } from "@/hooks/useScrollReveal";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { FeatureCard } from "@/components/ui/FeatureCard";
import type { Feature } from "@/types";

const FEATURES_DATA: Feature[] = [
  {
    icon: "🗺️",
    title: "Peta Real-time",
    description:
      "Lihat semua laporan di daerahmu dalam peta interaktif. Filter berdasarkan status, kategori, dan waktu.",
  },
  {
    icon: "🤖",
    title: "Didukung AI",
    description:
      "Klasifikasi otomatis, deteksi duplikat, prediksi tingkat bahaya, dan estimasi waktu perbaikan — semua ditenagai AI.",
  },
  {
    icon: "🔔",
    title: "Notifikasi Instan",
    description:
      "Dapatkan pemberitahuan setiap kali laporanmu diproses, di-update, atau selesai diperbaiki.",
  },
  {
    icon: "🔒",
    title: "Transparan 100%",
    description:
      "Setiap laporan punya PIC (penanggung jawab) yang namanya tampil jelas. Tidak ada proses yang tersembunyi.",
  },
  {
    icon: "📊",
    title: "Dasbor Pemerintah",
    description:
      "Analitik lengkap untuk pemerintah: tren kerusakan, prediksi risiko banjir, monitoring SLA, dan estimasi anggaran.",
  },
  {
    icon: "♿",
    title: "Aksesibel untuk Semua",
    description:
      "Didesain untuk semua orang — ramah disabilitas, mendukung bahasa daerah, dan mudah digunakan siapa saja.",
  },
] as const;

export function Features() {
  const sectionRef = useScrollReveal<HTMLElement>();

  return (
    <section id="fitur" className="section-padding bg-white" ref={sectionRef}>
      <div className="container-width reveal">
        <SectionHeader
          eyebrow="Fitur Unggulan"
          heading="Dirancang untuk Dampak Nyata"
          subheading="Setiap fitur dibangun dengan satu tujuan: memastikan infrastruktur publik benar-benar diperbaiki."
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {FEATURES_DATA.map((feature) => (
            <FeatureCard key={feature.title} feature={feature} />
          ))}
        </div>
      </div>
    </section>
  );
}
