// ── components/sections/Hero.tsx ──
"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { MapPin, CheckCircle, Clock, AlertTriangle } from "lucide-react";

const HERO_STATS = [
  { value: "1.247", label: "Laporan Selesai" },
  { value: "23", label: "Kategori" },
  { value: "<48 Jam", label: "Respons" },
  { value: "4.8★", label: "Kepuasan" },
] as const;

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const items = section.querySelectorAll(".stagger-item");
    items.forEach((item, index) => {
      setTimeout(() => {
        item.classList.add("is-visible");
      }, index * 100);
    });

    return () => {};
  }, []);

  return (
    <section
      ref={sectionRef}
      id="hero"
      className="relative flex min-h-screen items-center overflow-hidden bg-gradient-to-br from-navy via-navy to-blue"
    >
      {/* Dot grid overlay */}
      <div className="dot-grid absolute inset-0 z-0" />

      {/* Gradient orb decorations */}
      <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-blue/20 blur-3xl" />
      <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-teal/10 blur-3xl" />

      <div className="container-width relative z-10 section-padding">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left column — Text */}
          <div className="text-center lg:text-left">
            {/* Eyebrow */}
            <div className="stagger-item mb-6">
              <Badge variant="info" className="bg-white/10 text-white">
                🏆 IO Fest 2026 — Civic Technology
              </Badge>
            </div>

            {/* Headline */}
            <h1 className="stagger-item mb-6 font-display text-4xl font-extrabold leading-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
              Infrastruktur Rusak?{" "}
              <span className="bg-gradient-to-r from-blue-light to-teal-light bg-clip-text text-transparent">
                Laporkan. Pantau. Verifikasi.
              </span>
            </h1>

            {/* Subheading */}
            <p className="stagger-item mb-8 max-w-xl text-base leading-relaxed text-white/80 sm:text-lg lg:mx-0 mx-auto">
              Menghubungkan warga dengan pemerintah daerah untuk infrastruktur
              publik yang lebih baik. Lapor kerusakan, pantau perbaikan, dan
              pastikan semuanya benar-benar diperbaiki.
            </p>

            {/* CTAs */}
            <div className="stagger-item mb-10 flex flex-col items-center gap-4 sm:flex-row lg:justify-start sm:justify-center">
              <Button variant="primary" size="lg" href="#lapor">
                Buat Laporan Sekarang →
              </Button>
              <Button variant="outline-white" size="lg" href="/peta">
                Lihat Peta Laporan
              </Button>
            </div>

            {/* Stat pills */}
            <div className="stagger-item grid grid-cols-2 gap-3 sm:grid-cols-4">
              {HERO_STATS.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl bg-white/10 px-4 py-3 text-center backdrop-blur-sm"
                >
                  <div className="font-display text-lg font-bold text-white sm:text-xl">
                    {stat.value}
                  </div>
                  <div className="text-xs text-white/70">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right column — CSS Mockup */}
          <div className="stagger-item hidden lg:block">
            <div className="relative mx-auto max-w-md">
              {/* Browser frame */}
              <div className="rounded-2xl border border-white/10 bg-white/5 p-2 shadow-2xl backdrop-blur-sm">
                {/* Browser bar */}
                <div className="mb-3 flex items-center gap-2 rounded-t-xl bg-white/10 px-4 py-2">
                  <div className="flex gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
                    <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                    <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
                  </div>
                  <div className="ml-3 flex-1 rounded-md bg-white/10 px-3 py-1 text-xs text-white/50">
                    Laporin.id/peta
                  </div>
                </div>

                {/* Map mockup content */}
                <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-light/90 to-teal-light/60 p-6">
                  {/* Grid lines */}
                  <div className="absolute inset-0 opacity-20">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div
                        key={`h-${i}`}
                        className="absolute h-px w-full bg-navy/30"
                        style={{ top: `${(i + 1) * 16.6}%` }}
                      />
                    ))}
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div
                        key={`v-${i}`}
                        className="absolute h-full w-px bg-navy/30"
                        style={{ left: `${(i + 1) * 16.6}%` }}
                      />
                    ))}
                  </div>

                  {/* Map pins */}
                  <div className="absolute left-[20%] top-[25%]">
                    <MapPin size={20} className="fill-status-urgent text-status-urgent drop-shadow-md" />
                  </div>
                  <div className="absolute left-[55%] top-[35%]">
                    <MapPin size={20} className="fill-status-new text-status-new drop-shadow-md" />
                  </div>
                  <div className="absolute left-[70%] top-[60%]">
                    <MapPin size={20} className="fill-status-done text-status-done drop-shadow-md" />
                  </div>
                  <div className="absolute left-[35%] top-[70%]">
                    <MapPin size={20} className="fill-status-progress text-status-progress drop-shadow-md" />
                  </div>
                  <div className="absolute left-[80%] top-[20%]">
                    <MapPin size={20} className="fill-status-done text-status-done drop-shadow-md" />
                  </div>

                  {/* Floating report card */}
                  <div className="relative mt-24 ml-auto w-56 rounded-xl bg-white p-4 shadow-xl">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-600">
                        Baru
                      </span>
                      <span className="text-xs text-muted">2 jam lalu</span>
                    </div>
                    <div className="mb-1 flex items-center gap-1.5">
                      <AlertTriangle size={14} className="text-amber-500" />
                      <span className="font-display text-sm font-semibold text-navy">
                        Jalan Berlubang
                      </span>
                    </div>
                    <div className="mb-3 flex items-center gap-1 text-xs text-muted">
                      <MapPin size={12} />
                      Jl. Sudirman No. 45
                    </div>
                    {/* Progress bar */}
                    <div className="h-1.5 rounded-full bg-gray-100">
                      <div className="h-full w-1/4 rounded-full bg-amber-400" />
                    </div>
                  </div>

                  {/* Verified badge floating */}
                  <div className="absolute right-4 top-4 flex items-center gap-1 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white shadow-lg">
                    <CheckCircle size={14} />
                    Terverifikasi
                  </div>

                  {/* Response time floating */}
                  <div className="absolute bottom-4 left-4 flex items-center gap-1 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-navy shadow-lg">
                    <Clock size={14} className="text-blue" />
                    Respons 2 jam
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
