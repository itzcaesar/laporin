// ── components/dashboard/gov/AiAnalysisCard.tsx ──
"use client";

import { useState } from "react";
import { RefreshCw, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type AiAnalysisData = {
  categoryDetected: {
    emoji: string;
    name: string;
    confidence: number;
  };
  dangerLevel: number;
  dangerLabel: string;
  priorityScore: number;
  priorityLabel: string;
  hoaxConfidence: number;
  budgetEstimate: {
    minIdr: number;
    maxIdr: number;
    basis: string;
  } | null;
  impactSummary: string | null;
  beforeAfterVerification: {
    beforeUrl: string;
    afterUrl: string;
    progressDetected: boolean;
    confidence: number;
    description: string;
    concerns: string | null;
  } | null;
};

type AiAnalysisCardProps = {
  reportId: string;
  analysis: AiAnalysisData | null;
  isLoading?: boolean;
  onRefresh?: () => void;
};

const DANGER_COLORS = [
  { bg: "bg-green-500", text: "text-green-700", label: "Sangat Rendah" },
  { bg: "bg-lime-500", text: "text-lime-700", label: "Rendah" },
  { bg: "bg-amber-500", text: "text-amber-700", label: "Signifikan" },
  { bg: "bg-orange-500", text: "text-orange-700", label: "Berbahaya" },
  { bg: "bg-red-500", text: "text-red-700", label: "Kritis" },
];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);
};

export function AiAnalysisCard({
  reportId,
  analysis,
  isLoading = false,
  onRefresh,
}: AiAnalysisCardProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (!onRefresh) return;
    setIsRefreshing(true);
    await onRefresh();
    setIsRefreshing(false);
  };

  const getHoaxStatus = () => {
    if (!analysis) return { color: "text-gray-600", text: "—" };
    const conf = analysis.hoaxConfidence;
    if (conf < 20) {
      return { color: "text-green-700", text: `✅ ${conf}% — Aman diproses` };
    } else if (conf < 60) {
      return {
        color: "text-amber-700",
        text: `⚠ ${conf}% — Perlu diverifikasi manual`,
      };
    } else {
      return {
        color: "text-red-700",
        text: `🚫 ${conf}% — Kemungkinan hoaks, tahan laporan`,
      };
    }
  };

  const hoaxStatus = getHoaxStatus();

  if (isLoading) {
    return (
      <div className="rounded-2xl bg-teal-light border-l-4 border-teal p-6 animate-pulse">
        <div className="space-y-4">
          <div className="h-6 w-48 rounded bg-teal/20" />
          <div className="h-4 w-full rounded bg-teal/20" />
          <div className="h-4 w-3/4 rounded bg-teal/20" />
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="rounded-2xl bg-teal-light border-l-4 border-teal p-6">
        <div className="flex items-center gap-2 text-sm text-teal-900">
          <Loader2 size={16} className="animate-spin" />
          <span>🤖 Analisis AI sedang diproses...</span>
        </div>
      </div>
    );
  }

  const dangerColor = DANGER_COLORS[analysis.dangerLevel - 1] || DANGER_COLORS[2];
  const priorityPercent = analysis.priorityScore;

  return (
    <div className="rounded-2xl bg-teal-light border-l-4 border-teal p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold font-display text-teal-900">
          🤖 Analisis AI
        </h3>
        {onRefresh && (
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-teal-700 hover:bg-teal/10 transition-colors disabled:opacity-50"
          >
            <RefreshCw
              size={14}
              className={cn(isRefreshing && "animate-spin")}
            />
            Refresh
          </button>
        )}
      </div>

      <div className="space-y-6">
        {/* A) Kategori Terdeteksi */}
        <div>
          <h4 className="text-sm font-semibold text-teal-900 mb-2">
            Kategori Terdeteksi
          </h4>
          <div className="flex items-center gap-3">
            <span className="text-2xl">{analysis.categoryDetected.emoji}</span>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-teal-900">
                  {analysis.categoryDetected.name}
                </span>
                <span className="text-sm font-semibold text-teal-700">
                  {analysis.categoryDetected.confidence}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-teal/20 overflow-hidden">
                <div
                  className="h-full bg-teal transition-all duration-300"
                  style={{ width: `${analysis.categoryDetected.confidence}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* B) Tingkat Bahaya + Skor Prioritas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Tingkat Bahaya */}
          <div>
            <h4 className="text-sm font-semibold text-teal-900 mb-2">
              Tingkat Bahaya
            </h4>
            <div className="flex items-center gap-2 mb-1">
              <span className={cn("text-lg font-bold", dangerColor.text)}>
                ⚠ {analysis.dangerLevel} / 5
              </span>
              <span className="text-sm text-teal-800">{dangerColor.label}</span>
            </div>
            <div className="h-2 rounded-full bg-teal/20 overflow-hidden">
              <div
                className={cn("h-full transition-all duration-300", dangerColor.bg)}
                style={{ width: `${(analysis.dangerLevel / 5) * 100}%` }}
              />
            </div>
          </div>

          {/* Skor Prioritas */}
          <div>
            <h4 className="text-sm font-semibold text-teal-900 mb-2">
              Skor Prioritas
            </h4>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg font-bold text-blue">
                {analysis.priorityScore} / 100
              </span>
              <span className="text-sm text-teal-800">
                {analysis.priorityLabel}
              </span>
            </div>
            <div className="h-2 rounded-full bg-teal/20 overflow-hidden">
              <div
                className="h-full bg-blue transition-all duration-300"
                style={{ width: `${priorityPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* C) Deteksi Hoaks */}
        <div>
          <h4 className="text-sm font-semibold text-teal-900 mb-2">
            Deteksi Hoaks
          </h4>
          <p className={cn("text-sm font-medium", hoaxStatus.color)}>
            {hoaxStatus.text}
          </p>
        </div>

        {/* D) Estimasi Biaya */}
        {analysis.budgetEstimate && (
          <div>
            <h4 className="text-sm font-semibold text-teal-900 mb-2">
              Estimasi Biaya Perbaikan
            </h4>
            <p className="text-lg font-bold text-teal-900 mb-1">
              {formatCurrency(analysis.budgetEstimate.minIdr)} –{" "}
              {formatCurrency(analysis.budgetEstimate.maxIdr)}
            </p>
            <p className="text-xs text-teal-800">
              {analysis.budgetEstimate.basis}
            </p>
          </div>
        )}

        {/* E) Ringkasan Dampak */}
        {analysis.impactSummary && (
          <div>
            <h4 className="text-sm font-semibold text-teal-900 mb-2">
              Ringkasan Dampak
            </h4>
            <p className="text-sm text-teal-900 leading-relaxed">
              {analysis.impactSummary}
            </p>
          </div>
        )}

        {/* F) Verifikasi Foto Before/After */}
        {analysis.beforeAfterVerification && (
          <div>
            <h4 className="text-sm font-semibold text-teal-900 mb-3">
              Verifikasi Foto (Before vs After)
            </h4>
            <div className="flex items-center gap-4 mb-3">
              <img
                src={analysis.beforeAfterVerification.beforeUrl}
                alt="Before"
                className="w-24 h-24 rounded-lg object-cover border-2 border-teal/30"
              />
              <span className="text-teal-700 font-bold">→</span>
              <img
                src={analysis.beforeAfterVerification.afterUrl}
                alt="After"
                className="w-24 h-24 rounded-lg object-cover border-2 border-teal/30"
              />
            </div>
            <div
              className={cn(
                "rounded-lg p-3 text-sm",
                analysis.beforeAfterVerification.progressDetected
                  ? "bg-green-50 text-green-900"
                  : "bg-amber-50 text-amber-900"
              )}
            >
              {analysis.beforeAfterVerification.progressDetected ? (
                <>
                  <p className="font-semibold mb-1">
                    ✅ Progress perbaikan terdeteksi (
                    {analysis.beforeAfterVerification.confidence}% keyakinan)
                  </p>
                  <p className="text-xs leading-relaxed">
                    {analysis.beforeAfterVerification.description}
                  </p>
                </>
              ) : (
                <p className="font-semibold">
                  ⚠ AI tidak dapat memverifikasi progress perbaikan dari foto
                </p>
              )}
              {analysis.beforeAfterVerification.concerns && (
                <p className="text-xs text-amber-800 mt-2">
                  ⚠ Perhatian: {analysis.beforeAfterVerification.concerns}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
