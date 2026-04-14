// ── app/layout.tsx ──
import type { Metadata } from "next";
import { Plus_Jakarta_Sans, DM_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-dm",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Laporin — Laporkan. Pantau. Verifikasi.",
  description:
    "Platform pelaporan infrastruktur publik yang menghubungkan warga dengan pemerintah daerah. Laporkan kerusakan, pantau perbaikan, dan verifikasi hasilnya — transparan dan akuntabel.",
  manifest: "/manifest.json",
  keywords: [
    "infrastruktur",
    "laporan",
    "pemerintah",
    "civic technology",
    "Indonesia",
    "Laporin",
  ],
  authors: [{ name: "Laporin Team" }],
  openGraph: {
    title: "Laporin — Laporkan. Pantau. Verifikasi.",
    description:
      "Bridging citizens and government for better public infrastructure.",
    type: "website",
    locale: "id_ID",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Laporin",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport = {
  themeColor: "#1A3C6E",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${jakarta.variable} ${dmSans.variable}`}>
      <body className="font-body antialiased">{children}</body>
    </html>
  );
}
