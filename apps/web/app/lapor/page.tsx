// ── app/lapor/page.tsx ──
import type { Metadata } from "next";
import { ReportForm } from "@/components/sections/ReportForm";

export const metadata: Metadata = {
  title: "Buat Laporan — Laporin",
  description:
    "Laporkan kerusakan infrastruktur publik di sekitarmu. Pilih kategori, isi detail, tandai lokasi, dan unggah foto bukti.",
};

export default function LaporPage() {
  return <ReportForm />;
}
