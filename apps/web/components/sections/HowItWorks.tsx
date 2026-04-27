// ── components/sections/HowItWorks.tsx ──
"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { StepCard } from "@/components/ui/StepCard";
import type { Step } from '@/types/ui';

const CITIZEN_STEPS: Step[] = [
  {
    number: 1,
    icon: "📸",
    title: "Ambil Foto",
    description:
      "Foto kerusakan infrastruktur langsung dari HP-mu. AI kami akan mengenali jenis kerusakannya.",
  },
  {
    number: 2,
    icon: "📍",
    title: "Lokasi Otomatis",
    description:
      "GPS mendeteksi lokasimu secara otomatis. Tidak perlu ketik alamat — cukup konfirmasi.",
  },
  {
    number: 3,
    icon: "🤖",
    title: "AI Membantu",
    description:
      "Sistem AI mengklasifikasi laporan, mendeteksi duplikasi, dan mengarahkan ke dinas yang tepat.",
  },
  {
    number: 4,
    icon: "✅",
    title: "Pantau & Verifikasi",
    description:
      "Pantau progres perbaikan secara real-time. Setelah selesai, kamu yang verifikasi hasilnya.",
  },
] as const;

const GOVERNMENT_STEPS: Step[] = [
  {
    number: 1,
    icon: "📥",
    title: "Terima Laporan",
    description:
      "Laporan masuk dengan foto, lokasi GPS, dan klasifikasi AI. Sudah diverifikasi dan ditriase otomatis.",
  },
  {
    number: 2,
    icon: "👤",
    title: "Tugaskan PIC",
    description:
      "Tunjuk petugas penanggung jawab (PIC) yang namanya tampil transparan kepada warga pelapor.",
  },
  {
    number: 3,
    icon: "🔄",
    title: "Update Progress",
    description:
      "Upload foto progress perbaikan. Warga bisa memantau setiap tahapan secara real-time.",
  },
  {
    number: 4,
    icon: "🏁",
    title: "Warga Memverifikasi",
    description:
      "Setelah selesai, warga memverifikasi perbaikan. Bukan hanya ditandai 'done' — tapi benar-benar dicek.",
  },
] as const;

type TabValue = "citizen" | "government";

const TABS: { value: TabValue; label: string }[] = [
  { value: "citizen", label: "Untuk Warga" },
  { value: "government", label: "Untuk Pemerintah" },
] as const;

export function HowItWorks() {
  const [activeTab, setActiveTab] = useState<TabValue>("citizen");
  const sectionRef = useScrollReveal<HTMLElement>();

  const steps = activeTab === "citizen" ? CITIZEN_STEPS : GOVERNMENT_STEPS;

  const handleTabChange = (tab: TabValue) => {
    setActiveTab(tab);
  };

  return (
    <section
      id="cara-kerja"
      className="section-padding bg-surface"
      ref={sectionRef}
    >
      <div className="container-width reveal">
        <SectionHeader
          eyebrow="Cara Kerja"
          heading="Semudah 4 Langkah"
          subheading="Dari laporan sampai perbaikan terverifikasi — transparan di setiap tahap."
        />

        {/* Tab switcher */}
        <div
          className="mx-auto mb-12 flex w-full max-w-md overflow-hidden rounded-xl bg-gray-100 p-1"
          role="tablist"
        >
          {TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.value}
              onClick={() => handleTabChange(tab.value)}
              className={cn(
                "flex-1 rounded-lg px-4 py-3 font-display text-sm font-semibold",
                "min-h-[44px] transition-all duration-200",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2",
                activeTab === tab.value
                  ? "bg-navy text-white shadow-sm"
                  : "text-muted hover:text-navy"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Steps grid */}
        <div className="grid gap-6 md:grid-cols-4">
          {steps.map((step, index) => (
            <StepCard
              key={`${activeTab}-${step.number}`}
              step={step}
              isLast={index === steps.length - 1}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
