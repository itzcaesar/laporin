// ── components/sections/Stats.tsx ──
"use client";

import { useScrollReveal } from "@/hooks/useScrollReveal";
import { StatCounter } from "@/components/ui/StatCounter";
import type { Stat } from '@/types/ui';

const STATS_DATA: Stat[] = [
  { value: 47392, label: "Laporan Diterima", suffix: "+" },
  { value: 89, label: "Diselesaikan Tepat Waktu", suffix: "%" },
  { value: 312, label: "Dinas Terhubung", suffix: "+" },
  { value: 4.8, label: "Rating Kepuasan", suffix: "★", decimals: 1 },
] as const;

export function Stats() {
  const sectionRef = useScrollReveal<HTMLElement>();

  return (
    <section
      id="statistik"
      className="relative overflow-hidden py-16 md:py-20 lg:py-24"
      ref={sectionRef}
    >
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-navy via-navy to-blue" />
      <div className="dot-grid absolute inset-0" />

      {/* Decorative orbs */}
      <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-blue/20 blur-3xl" />
      <div className="absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-teal/15 blur-3xl" />

      <div className="container-width relative z-10 px-4 sm:px-6 lg:px-8 reveal">
        <div className="mb-12 text-center">
          <h2 className="font-display text-3xl font-bold text-white md:text-4xl">
            Dampak Nyata, Bukan Sekadar Angka
          </h2>
          <p className="mt-4 text-base text-white/70 md:text-lg">
            Setiap angka mewakili jalan yang diperbaiki, lampu yang menyala, dan
            warga yang didengar.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {STATS_DATA.map((stat) => (
            <StatCounter key={stat.label} stat={stat} />
          ))}
        </div>
      </div>
    </section>
  );
}
