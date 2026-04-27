// ── components/sections/StatusFlow.tsx ──
"use client";

import { useScrollReveal } from "@/hooks/useScrollReveal";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { StatusStage } from '@/types/ui';

const STATUS_STAGES: StatusStage[] = [
  {
    status: "new",
    label: "Baru",
    description: "Laporan baru masuk dan menunggu verifikasi oleh petugas.",
    color: "#FEF3C7",
    textColor: "#92400E",
    emoji: "🟡",
  },
  {
    status: "verified",
    label: "Diverifikasi",
    description: "Laporan valid dan sudah dikonfirmasi oleh petugas dinas.",
    color: "#DBEAFE",
    textColor: "#1E40AF",
    emoji: "🔵",
  },
  {
    status: "in_progress",
    label: "Diproses",
    description: "Perbaikan sedang dikerjakan oleh petugas di lapangan.",
    color: "#FED7AA",
    textColor: "#9A3412",
    emoji: "🟠",
  },
  {
    status: "completed",
    label: "Selesai",
    description: "Perbaikan selesai. Menunggu verifikasi dari warga pelapor.",
    color: "#D1FAE5",
    textColor: "#065F46",
    emoji: "🟢",
  },
  {
    status: "verified_complete",
    label: "Terverifikasi",
    description: "Warga telah memverifikasi bahwa perbaikan benar-benar selesai.",
    color: "#ECFDF5",
    textColor: "#047857",
    emoji: "✅",
  },
] as const;

export function StatusFlow() {
  const sectionRef = useScrollReveal<HTMLElement>();

  return (
    <section
      id="alur-status"
      className="section-padding bg-surface"
      ref={sectionRef}
    >
      <div className="container-width reveal">
        <SectionHeader
          eyebrow="Alur Laporan"
          heading="Transparan di Setiap Tahap"
          subheading="Setiap laporan melewati alur yang jelas. Kamu bisa memantau statusnya kapan saja."
        />

        {/* Desktop: horizontal pipeline */}
        <div className="hidden lg:block">
          <div className="relative flex items-start justify-between">
            {/* Connector line */}
            <div className="absolute left-0 right-0 top-6 h-1 rounded-full bg-gradient-to-r from-amber-300 via-blue via-orange-400 via-emerald-400 to-emerald-500" />

            {STATUS_STAGES.map((stage) => (
              <div
                key={stage.status}
                className="relative z-10 flex w-48 flex-col items-center text-center"
              >
                {/* Circle node */}
                <div
                  className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border-4 border-white text-xl shadow-md"
                  style={{ backgroundColor: stage.color }}
                >
                  {stage.emoji}
                </div>
                <StatusBadge stage={stage} className="mb-3" />
                <p className="text-xs leading-relaxed text-muted">
                  {stage.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile/Tablet: vertical stepper */}
        <div className="lg:hidden">
          <div className="relative pl-8">
            {/* Vertical line */}
            <div className="absolute bottom-0 left-[18px] top-0 w-0.5 bg-gradient-to-b from-amber-300 via-blue via-orange-400 to-emerald-500" />

            <div className="space-y-8">
              {STATUS_STAGES.map((stage) => (
                <div key={stage.status} className="relative flex gap-4">
                  {/* Circle node */}
                  <div
                    className="relative z-10 -ml-8 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-4 border-white text-sm shadow-md"
                    style={{ backgroundColor: stage.color }}
                  >
                    {stage.emoji}
                  </div>
                  <div className="pt-1">
                    <StatusBadge stage={stage} className="mb-2" />
                    <p className="text-sm leading-relaxed text-muted">
                      {stage.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
