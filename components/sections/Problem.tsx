// ── components/sections/Problem.tsx ──
"use client";

import { useScrollReveal } from "@/hooks/useScrollReveal";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Card } from "@/components/ui/Card";

interface PainPoint {
  emoji: string;
  title: string;
  description: string;
}

const PAIN_POINTS: PainPoint[] = [
  {
    emoji: "🕳️",
    title: "Laporan Hilang Tanpa Jejak",
    description:
      "Kamu sudah lapor lewat media sosial atau telepon, tapi tidak ada yang tahu statusnya. Laporanmu hilang begitu saja.",
  },
  {
    emoji: "🤷",
    title: "Tidak Ada Akuntabilitas",
    description:
      "Siapa yang bertanggung jawab? Tidak ada petugas yang ditunjuk, tidak ada tenggat waktu, tidak ada konsekuensi.",
  },
  {
    emoji: "📍",
    title: "Masalah yang Sama, Bertahun-tahun",
    description:
      "Jalan berlubang di depan sekolah? Lampu jalan mati di persimpangan? Sudah berapa lama kamu melewatinya?",
  },
  {
    emoji: "🔇",
    title: "Suara Warga Tidak Didengar",
    description:
      "Warga ingin membantu, tapi tidak tahu harus lapor ke mana. Pemerintah ingin bertindak, tapi tidak tahu masalah di mana.",
  },
] as const;

export function Problem() {
  const sectionRef = useScrollReveal<HTMLElement>();

  return (
    <section id="masalah" className="section-padding bg-white" ref={sectionRef}>
      <div className="container-width reveal">
        <SectionHeader
          heading="Sudah berapa lama kamu melewati jalan berlubang yang sama?"
          subheading="Setiap hari, jutaan warga Indonesia menghadapi infrastruktur rusak tanpa tahu cara melaporkannya secara efektif."
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
          {PAIN_POINTS.map((point) => (
            <Card 
              key={point.title} 
              hover 
              padding="md"
              className="group flex flex-row items-start gap-4 border-red-50 transition-colors hover:border-red-100 sm:flex-col sm:items-start sm:gap-0"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-50 text-xl transition-colors group-hover:bg-red-100/50 sm:mb-4 sm:h-14 sm:w-14 sm:text-3xl">
                <span className="drop-shadow-sm">{point.emoji}</span>
              </div>
              <div className="flex flex-col">
                <h3 className="mb-1 font-display text-base font-bold text-navy sm:mb-2 sm:text-lg">
                  {point.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted">
                  {point.description}
                </p>
              </div>
            </Card>
          ))}
        </div>

        {/* Bridge text */}
        <div className="mt-12 text-center">
          <p className="font-display text-xl font-bold text-navy md:text-2xl">
            Laporin mengubah semua ini.
          </p>
          <p className="mt-2 text-muted">
            Bukan sekadar laporan. Ini adalah suaramu untuk kotamu.
          </p>
        </div>
      </div>
    </section>
  );
}
