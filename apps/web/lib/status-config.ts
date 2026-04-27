// ── lib/status-config.ts ──
// Status configuration for badges and display

import type { ReportStatus } from '@laporin/types';

export interface StatusConfig {
  label: string;
  emoji: string;
  color: string;
  bg: string;
  border: string;
  textColor: string;
}

export const STATUS_CONFIG: Record<ReportStatus, StatusConfig> = {
  new: {
    label: "Baru",
    emoji: "🟡",
    color: "#FEF3C7",
    bg: "bg-amber-100",
    border: "border-amber-200",
    textColor: "#92400E",
  },
  verified: {
    label: "Diverifikasi",
    emoji: "🔵",
    color: "#DBEAFE",
    bg: "bg-blue-100",
    border: "border-blue-200",
    textColor: "#1E40AF",
  },
  in_progress: {
    label: "Diproses",
    emoji: "🟠",
    color: "#FFEDD5",
    bg: "bg-orange-100",
    border: "border-orange-200",
    textColor: "#9A3412",
  },
  completed: {
    label: "Selesai",
    emoji: "🟢",
    color: "#D1FAE5",
    bg: "bg-green-100",
    border: "border-green-200",
    textColor: "#065F46",
  },
  verified_complete: {
    label: "Terverifikasi Selesai",
    emoji: "✅",
    color: "#D1FAE5",
    bg: "bg-emerald-100",
    border: "border-emerald-200",
    textColor: "#064E3B",
  },
  rejected: {
    label: "Ditolak",
    emoji: "❌",
    color: "#FEE2E2",
    bg: "bg-red-100",
    border: "border-red-200",
    textColor: "#991B1B",
  },
  disputed: {
    label: "Disengketakan",
    emoji: "🔴",
    color: "#FFE4E6",
    bg: "bg-rose-100",
    border: "border-rose-200",
    textColor: "#881337",
  },
  closed: {
    label: "Ditutup",
    emoji: "⚫",
    color: "#F3F4F6",
    bg: "bg-gray-100",
    border: "border-gray-200",
    textColor: "#374151",
  },
};

export function getStatusConfig(status: ReportStatus): StatusConfig {
  return STATUS_CONFIG[status];
}
