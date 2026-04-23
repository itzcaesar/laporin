// ── app/gov/surveys/page.tsx ──
"use client";

import { useState } from "react";
import { Star, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

import { useSurveys, type SurveyResponse } from "@/hooks/useSurveys";
import { useGovAnalytics } from "@/hooks/useGovAnalytics";

export default function GovSurveysPage() {
  const [timeRange, setTimeRange] = useState("30");
  const { surveys: responses, isLoading } = useSurveys(1, 100);
  const { data: analyticsData } = useGovAnalytics(timeRange as any);

  // Calculate averages
  const calculateAverage = (key: keyof SurveyResponse["ratings"]) => {
    if (responses.length === 0) return "0.0";
    const sum = responses.reduce((acc, r) => acc + (r.ratings[key] || 0), 0);
    return (sum / responses.length).toFixed(1);
  };

  const overallSatisfaction = analyticsData?.satisfaction?.averageRating 
    ? analyticsData.satisfaction.averageRating.toFixed(1)
    : calculateAverage("satisfaction");
    
  const responseRate = analyticsData?.satisfaction?.responseRate || 0;
  const totalSurveys = analyticsData?.satisfaction?.totalRatings || responses.length;

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-display text-navy mb-2">
          Survei Kepuasan
        </h1>
        <p className="text-sm text-muted">
          Analisis feedback dan kepuasan warga terhadap layanan
        </p>
      </div>

      {/* Time Range Filter */}
      <div className="mb-6 flex items-center gap-2">
        <span className="text-sm font-medium text-muted">Periode:</span>
        <div className="flex gap-2">
          {["7", "30", "90"].map((days) => (
            <button
              key={days}
              onClick={() => setTimeRange(days)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                timeRange === days
                  ? "bg-navy text-white"
                  : "bg-white border border-border text-ink hover:bg-surface"
              )}
            >
              {days} Hari
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl bg-white p-5 border border-border">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted">Kepuasan Keseluruhan</p>
            <TrendingUp size={16} className="text-green-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold font-display text-navy">
              {overallSatisfaction}
            </p>
            <div className="flex items-center">
              <Star size={16} className="fill-amber-400 text-amber-400" />
              <span className="text-sm text-muted ml-1">/ 5.0</span>
            </div>
          </div>
          <p className="text-xs text-green-600 mt-1">+0.3 dari bulan lalu</p>
        </div>

        <div className="rounded-xl bg-white p-5 border border-border">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted">Response Rate</p>
            <TrendingUp size={16} className="text-green-600" />
          </div>
          <p className="text-3xl font-bold font-display text-navy">
            {responseRate}%
          </p>
          <p className="text-xs text-green-600 mt-1">+5% dari bulan lalu</p>
        </div>

        <div className="rounded-xl bg-white p-5 border border-border">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted">Total Survei</p>
            <Minus size={16} className="text-muted" />
          </div>
          <p className="text-3xl font-bold font-display text-navy">
            {totalSurveys}
          </p>
          <p className="text-xs text-muted mt-1">Dalam {timeRange} hari terakhir</p>
        </div>

        <div className="rounded-xl bg-white p-5 border border-border">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted">Kecepatan Respon</p>
            <TrendingDown size={16} className="text-red-600" />
          </div>
          <p className="text-3xl font-bold font-display text-navy">
            {calculateAverage("speed")}
          </p>
          <p className="text-xs text-red-600 mt-1">-0.2 dari bulan lalu</p>
        </div>
      </div>

      {/* Detailed Ratings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="rounded-xl bg-white p-6 border border-border">
          <h3 className="text-base font-semibold text-navy mb-4">
            Rating per Kategori
          </h3>
          <div className="space-y-4">
            {[
              { key: "speed" as const, label: "Kecepatan Penanganan" },
              { key: "quality" as const, label: "Kualitas Perbaikan" },
              { key: "communication" as const, label: "Komunikasi Petugas" },
              { key: "satisfaction" as const, label: "Kepuasan Keseluruhan" },
            ].map((item) => {
              const avg = parseFloat(calculateAverage(item.key));
              const percentage = (avg / 5) * 100;

              return (
                <div key={item.key}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-ink">{item.label}</span>
                    <div className="flex items-center gap-1">
                      <Star
                        size={14}
                        className="fill-amber-400 text-amber-400"
                      />
                      <span className="text-sm font-semibold text-navy">
                        {avg.toFixed(1)}
                      </span>
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 border border-border">
          <h3 className="text-base font-semibold text-navy mb-4">
            Distribusi Rating
          </h3>
          <div className="space-y-3">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = responses.filter(
                (r) => r.ratings.satisfaction === rating
              ).length;
              const percentage = (count / responses.length) * 100;

              return (
                <div key={rating} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 w-16">
                    <span className="text-sm font-medium text-ink">
                      {rating}
                    </span>
                    <Star
                      size={12}
                      className="fill-amber-400 text-amber-400"
                    />
                  </div>
                  <div className="flex-1 h-6 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full bg-amber-400 transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-muted w-12 text-right">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Responses */}
      <div className="rounded-xl bg-white p-6 border border-border">
        <h3 className="text-base font-semibold text-navy mb-4">
          Tanggapan Terbaru
        </h3>
        {isLoading ? (
          <div className="flex h-32 items-center justify-center">
            <div className="text-sm text-muted">Memuat survei...</div>
          </div>
        ) : responses.length > 0 ? (
          <div className="space-y-4">
            {responses.map((response) => (
              <div
                key={response.id}
                className="p-4 rounded-lg border border-border hover:bg-surface/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="font-mono text-sm font-semibold text-blue">
                      {response.reportTrackingCode || "Unknown"}
                    </span>
                    <p className="text-xs text-muted mt-1">
                      {new Date(response.submittedAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star
                      size={16}
                      className="fill-amber-400 text-amber-400"
                    />
                    <span className="text-sm font-semibold text-navy">
                      {response.ratings.satisfaction}.0
                    </span>
                  </div>
                </div>
                {response.comment && (
                  <p className="text-sm text-ink leading-relaxed">
                    "{response.comment}"
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex h-32 flex-col items-center justify-center text-center">
            <p className="text-sm text-muted">Belum ada tanggapan survei</p>
          </div>
        )}
      </div>
    </div>
  );
}
