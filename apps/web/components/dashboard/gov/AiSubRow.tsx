// ── components/dashboard/gov/AiSubRow.tsx ──
"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";

type AiAnalysisData = {
  priorityScore: number;
  priorityLabel: string;
  hoaxConfidence: number;
  hoaxLabel: string;
  dangerLevel: number;
  dangerLabel: string;
  aiSummary: string | null;
};

type AiSubRowProps = {
  reportId: string;
  analysis: AiAnalysisData | null;
  isLoading?: boolean;
};

const HOAX_THRESHOLD = {
  safe: 20,
  warning: 60,
};

export function AiSubRow({ reportId, analysis, isLoading = false }: AiSubRowProps) {
  if (isLoading || !analysis) {
    return (
      <tr>
        <td colSpan={100} className="bg-gray-50 border-t border-border">
          <div className="flex items-center gap-2 px-6 py-4 text-sm text-muted">
            <Loader2 size={16} className="animate-spin" />
            <span>🤖 Analisis AI sedang diproses...</span>
          </div>
        </td>
      </tr>
    );
  }

  // Determine hoax status color and text
  const getHoaxStatus = () => {
    if (analysis.hoaxConfidence < HOAX_THRESHOLD.safe) {
      return {
        color: "text-green-700",
        text: `✅ ${analysis.hoaxConfidence}% — Aman`,
      };
    } else if (analysis.hoaxConfidence < HOAX_THRESHOLD.warning) {
      return {
        color: "text-amber-700",
        text: `⚠ ${analysis.hoaxConfidence}% — Perlu Diverifikasi`,
      };
    } else {
      return {
        color: "text-red-700",
        text: `🚫 ${analysis.hoaxConfidence}% — Kemungkinan Hoaks`,
      };
    }
  };

  const hoaxStatus = getHoaxStatus();

  return (
    <tr>
      <td colSpan={100} className="bg-gray-50 border-t border-border">
        <div className="px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            {/* Priority Score */}
            <div>
              <span className="text-muted">🤖 Skor Prioritas:</span>{" "}
              <span className="font-semibold text-ink">
                {analysis.priorityScore}/100
              </span>{" "}
              <span className="text-muted">({analysis.priorityLabel})</span>
            </div>

            {/* Hoax Detection */}
            <div>
              <span className="text-muted">🚫 Hoaks:</span>{" "}
              <span className={`font-semibold ${hoaxStatus.color}`}>
                {hoaxStatus.text}
              </span>
            </div>

            {/* Danger Level */}
            <div>
              <span className="text-muted">⚠ Bahaya:</span>{" "}
              <span className="font-semibold text-ink">
                {analysis.dangerLevel}/5
              </span>{" "}
              <span className="text-muted">({analysis.dangerLabel})</span>
            </div>

            {/* AI Summary */}
            <div className="md:col-span-2 lg:col-span-1">
              <span className="text-muted">💬 Ringkasan:</span>{" "}
              <span className="text-ink">
                {analysis.aiSummary
                  ? `"${analysis.aiSummary.substring(0, 50)}..."`
                  : "—"}
              </span>
            </div>
          </div>

          {/* View Full Analysis Link */}
          <div className="mt-3">
            <Link
              href={`/gov/reports/${reportId}`}
              className="text-sm font-medium text-blue hover:text-blue/80 transition-colors"
            >
              Lihat Analisis Lengkap →
            </Link>
          </div>
        </div>
      </td>
    </tr>
  );
}
