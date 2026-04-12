// ── components/sections/Hero.tsx ──
"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { MapPin, CheckCircle, Clock, AlertTriangle, ChevronDown, Heart, MessageCircle, Send } from "lucide-react";

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

    return () => { };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="hero"
      className="relative flex min-h-[100dvh] items-center overflow-hidden bg-gradient-to-br from-navy via-navy to-blue sm:min-h-screen"
    >
      {/* Gradient orb decorations */}
      <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-blue/20 blur-3xl" />
      <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-teal/10 blur-3xl" />

      {/* Dot grid overlay */}
      <div className="dot-grid absolute inset-0 z-0 opacity-60 sm:opacity-100" />

      <div className="container-width relative z-10 px-4 py-12 sm:section-padding">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left column — Text */}
          <div className="text-center lg:text-left">
            {/* Eyebrow */}
            <div className="stagger-item mb-4 sm:mb-6">
              <Badge variant="info" className="bg-white/10 text-white text-xs">
                🏆 IO Fest 2026 — Civic Technology
              </Badge>
            </div>

            {/* Headline */}
            <h1 className="stagger-item mb-4 font-display text-3xl font-extrabold leading-tight text-white sm:mb-6 sm:text-5xl md:text-6xl lg:text-7xl">
              Infrastruktur Rusak?{" "}
              <span className="bg-gradient-to-r from-blue-light to-teal-light bg-clip-text text-transparent">
                Laporkan. Pantau. Verifikasi.
              </span>
            </h1>

            {/* Subheading */}
            <p className="stagger-item mb-6 max-w-xl text-sm leading-relaxed text-white/80 sm:mb-8 sm:text-lg lg:mx-0 mx-auto">
              Menghubungkan warga dengan pemerintah daerah untuk infrastruktur
              publik yang lebih baik. Lapor kerusakan, pantau perbaikan, dan
              pastikan semuanya benar-benar diperbaiki.
            </p>

            {/* CTAs */}
            <div className="stagger-item mb-8 flex flex-col items-center gap-3 sm:mb-10 sm:flex-row sm:gap-4 lg:justify-start sm:justify-center">
              <Button variant="primary" size="lg" href="#lapor" className="w-full sm:w-auto">
                Buat Laporan Sekarang →
              </Button>
              <Button variant="outline-white" size="lg" href="/peta" className="w-full sm:w-auto">
                Lihat Peta Laporan
              </Button>
            </div>

            {/* Stat pills */}
            <div className="stagger-item grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
              {HERO_STATS.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl bg-white/10 px-3 py-2.5 text-center backdrop-blur-sm sm:px-4 sm:py-3"
                >
                  <div className="font-display text-base font-bold text-white sm:text-xl">
                    {stat.value}
                  </div>
                  <div className="text-[10px] text-white/70 sm:text-xs">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right column — CSS Mockups */}
          <div className="stagger-item hidden lg:block">
            <div className="relative ml-auto mr-0 w-full max-w-[500px] h-[480px] lg:translate-x-6 xl:translate-x-12">

              {/* Back Window - IG Post Mockup */}
              <div
                className="absolute right-0 top-0 z-0 w-[400px] rounded-2xl border border-white/10 bg-white/5 p-2 shadow-2xl backdrop-blur-sm transition-all duration-500 hover:z-20 hover:-translate-x-6 hover:-translate-y-6 hover:rotate-3"
              >
                {/* Browser bar */}
                <div className="mb-2 flex items-center gap-2 rounded-t-xl bg-white/10 px-4 py-2 opacity-80">
                  <div className="flex gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
                    <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                    <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
                  </div>
                  <div className="ml-3 flex-1 rounded-md bg-white/10 px-3 py-1 text-xs text-white/50">
                    Laporin.site/laporan/124
                  </div>
                </div>

                {/* Content - IG Style */}
                <div className="flex h-[280px] overflow-hidden rounded-xl bg-[#FAFAFA] text-navy shadow-inner">
                  {/* Image side */}
                  <div className="relative w-[55%] bg-gray-200">
                    <img
                      src="https://images.hukumonline.com/frontend/lt5a954764bab1a/lt5a954d70cd9dd.jpg"
                      alt="Pothole"
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute left-2 top-2 rounded bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                      Menunggu
                    </div>
                  </div>

                  {/* Right side - comments */}
                  <div className="flex w-[45%] flex-col p-3 border-l border-gray-100 bg-white">
                    {/* Header */}
                    <div className="mb-3 flex items-center gap-2 border-b border-gray-100 pb-2">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-blue to-teal text-[10px] font-bold text-white">
                        BL
                      </div>
                      <div className="flex flex-col overflow-hidden">
                        <span className="truncate text-[11px] font-bold">budi_lapor</span>
                        <span className="truncate text-[8px] text-gray-500">Jl. Sudirman No 45</span>
                      </div>
                    </div>
                    {/* Desc */}
                    <div className="mb-3 space-y-2">
                      <div className="h-1.5 w-full rounded-full bg-gray-100" />
                      <div className="h-1.5 w-4/5 rounded-full bg-gray-100" />
                      <div className="h-1.5 w-2/3 rounded-full bg-gray-100" />
                    </div>
                    {/* Time */}
                    <div className="mb-auto text-[9px] font-semibold text-gray-400">
                      2 JAM YANG LALU
                    </div>
                    {/* Verification / Progress */}
                    <div className="mb-3 mt-1 rounded-lg bg-blue-50 p-2 text-center border border-blue-100">
                      <div className="text-[10px] font-bold text-blue-700">
                        Masuk Antrean
                      </div>
                      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-blue-200/50">
                        <div className="h-full w-1/3 rounded-full bg-blue-500"></div>
                      </div>
                    </div>
                    {/* Actions */}
                    <div className="flex gap-3 border-t border-gray-100 pt-2 text-gray-400">
                      <Heart size={14} className="hover:text-red-500 transition-colors cursor-pointer" />
                      <MessageCircle size={14} className="hover:text-blue transition-colors cursor-pointer" />
                      <Send size={14} className="ml-auto hover:text-blue transition-colors cursor-pointer" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Front Window - Map Mockup */}
              <div
                className="absolute bottom-0 left-0 xl:-left-12 z-10 w-[420px] rounded-2xl border border-white/10 bg-white/5 p-2 shadow-2xl backdrop-blur-xl transition-all duration-500 hover:-translate-y-4 hover:-rotate-3"
              >
                {/* Browser bar */}
                <div className="mb-3 flex items-center gap-2 rounded-t-xl bg-white/10 px-4 py-2">
                  <div className="flex gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
                    <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                    <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
                  </div>
                  <div className="ml-3 flex-1 rounded-md bg-white/10 px-3 py-1 text-xs text-white/50">
                    Laporin.site/peta
                  </div>
                </div>

                {/* Map mockup content */}
                <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-light/90 to-teal-light/60 p-6 min-h-[280px]">
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
                  <div className="absolute left-[20%] top-[25%] -translate-x-1/2 -translate-y-1/2">
                    <MapPin size={24} className="fill-status-urgent text-status-urgent drop-shadow-[0_4px_4px_rgba(0,0,0,0.3)] filter" />
                  </div>
                  <div className="absolute left-[55%] top-[35%] -translate-x-1/2 -translate-y-1/2">
                    <MapPin size={24} className="fill-status-new text-status-new drop-shadow-[0_4px_4px_rgba(0,0,0,0.3)] filter" />
                  </div>
                  <div className="absolute left-[70%] top-[60%] -translate-x-1/2 -translate-y-1/2">
                    <MapPin size={24} className="fill-status-done text-status-done drop-shadow-[0_4px_4px_rgba(0,0,0,0.3)] filter" />
                  </div>
                  <div className="absolute left-[35%] top-[70%] -translate-x-1/2 -translate-y-1/2">
                    <MapPin size={24} className="fill-status-progress text-status-progress drop-shadow-[0_4px_4px_rgba(0,0,0,0.3)] filter" />
                  </div>
                  <div className="absolute left-[80%] top-[20%] -translate-x-1/2 -translate-y-1/2">
                    <MapPin size={24} className="fill-status-done text-status-done drop-shadow-[0_4px_4px_rgba(0,0,0,0.3)] filter" />
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

      {/* Learn More Scroll Indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 sm:bottom-10 pointer-events-none">
        <div className="flex animate-bounce flex-col items-center gap-2">
          {/* Glassmorphic Pill */}
          <div className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-2.5 backdrop-blur-xl">
            <span className="font-display text-[11px] font-semibold tracking-[0.2em] text-white/90">
              PELAJARI LEBIH LANJUT
            </span>
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-navy">
              <ChevronDown size={14} className="stroke-[3]" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
