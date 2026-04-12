// ── app/peta/page.tsx ──
import type { Metadata } from "next";
import { MapPageClient } from "@/components/map/MapPageClient";

export const metadata: Metadata = {
  title: "Peta Laporan — Laporin",
  description:
    "Lihat semua laporan infrastruktur di area Buah Batu, Bandung dalam peta interaktif. Filter berdasarkan status dan lihat detail setiap laporan.",
};

export default function PetaPage() {
  return <MapPageClient />;
}
