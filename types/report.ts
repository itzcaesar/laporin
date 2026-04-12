// ── types/report.ts ──

export type ReportStatusMap = "baru" | "diverifikasi" | "diproses" | "selesai" | "terverifikasi";

export interface MockReport {
  id: string;
  title: string;
  category: string;
  categoryEmoji: string;
  description: string;
  location: string;
  lat: number;
  lng: number;
  status: ReportStatusMap;
  statusLabel: string;
  reporter: string;
  reportedAt: string;
  pic?: string;
  upvotes: number;
  comments: number;
  downvotes: number;
  priority: "Rendah" | "Sedang" | "Tinggi" | "Kritis";
  mockComments: { author: string; text: string; time: string }[];
  photoPlaceholder: string;
}

export interface StatusConfig {
  color: string;
  bg: string;
  border: string;
  markerColor: string;
  label: string;
}
