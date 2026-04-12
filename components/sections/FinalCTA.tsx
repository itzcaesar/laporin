// ── components/sections/FinalCTA.tsx ──
"use client";

import { useScrollReveal } from "@/hooks/useScrollReveal";
import { Button } from "@/components/ui/Button";
import type { EmergencyNumber } from "@/types";

const EMERGENCY_NUMBERS: EmergencyNumber[] = [
  { emoji: "🚒", service: "Damkar", number: "113" },
  { emoji: "💧", service: "PDAM", number: "1500" },
  { emoji: "⚡", service: "PLN", number: "123" },
  { emoji: "🚑", service: "Ambulans", number: "119" },
] as const;

export function FinalCTA() {
  const sectionRef = useScrollReveal<HTMLElement>();

  return (
    <section
      id="cta"
      className="relative overflow-hidden py-10 sm:py-16 md:py-20 lg:py-24"
      ref={sectionRef}
    >
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-navy to-blue" />
      <div className="dot-grid absolute inset-0" />

      {/* Decorative orbs */}
      <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-teal/15 blur-3xl" />
      <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-blue/20 blur-3xl" />

      <div className="container-width relative z-10 px-4 text-center sm:px-6 lg:px-8 reveal">
        {/* Heading */}
        <h2 className="mb-3 font-display text-2xl font-bold text-white sm:mb-4 sm:text-3xl md:text-4xl lg:text-5xl">
          Mulai Ubah Kotamu Hari Ini
        </h2>
        <p className="mx-auto mb-6 max-w-2xl text-sm leading-relaxed text-white/80 sm:mb-8 sm:text-base md:text-lg">
          Jalan berlubang di depan sekolah anakmu? Lampu jalan mati di
          persimpangan? Jangan tunggu lagi. Laporkan sekarang dan pantau sampai
          benar-benar diperbaiki.
        </p>

        {/* CTA buttons */}
        <div className="mb-8 flex flex-col items-center justify-center gap-3 sm:mb-12 sm:flex-row sm:gap-4">
          <Button
            variant="primary"
            size="lg"
            href="#lapor"
            className="w-full bg-white text-navy hover:bg-white/90 sm:w-auto"
          >
            Buat Laporan Sekarang →
          </Button>
          <Button variant="outline-white" size="lg" href="/peta" className="w-full sm:w-auto">
            Lihat Peta Laporan
          </Button>
        </div>

        {/* Emergency numbers */}
        <div className="rounded-2xl bg-white/10 p-6 backdrop-blur-sm">
          <p className="mb-4 font-display text-sm font-semibold uppercase tracking-wider text-white/70">
            Nomor Darurat
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8">
            {EMERGENCY_NUMBERS.map((item) => (
              <div
                key={item.service}
                className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-white"
              >
                <span className="text-lg">{item.emoji}</span>
                <span className="font-display text-sm font-semibold">
                  {item.service}
                </span>
                <span className="font-display text-sm font-bold text-white/90">
                  {item.number}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
