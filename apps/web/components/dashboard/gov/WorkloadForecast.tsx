// ── components/dashboard/gov/WorkloadForecast.tsx ──
"use client";

type WorkloadForecastProps = {
  forecast: {
    predictedTotal: number;
    recommendation: string | null;
  } | null;
  isLoading?: boolean;
};

export function WorkloadForecast({
  forecast,
  isLoading = false,
}: WorkloadForecastProps) {
  if (isLoading) {
    return (
      <div className="rounded-2xl bg-gray-50 border border-border p-4 animate-pulse">
        <div className="h-4 w-32 rounded bg-gray-200 mb-3" />
        <div className="h-6 w-48 rounded bg-gray-200 mb-2" />
        <div className="h-3 w-full rounded bg-gray-200" />
      </div>
    );
  }

  if (!forecast) return null;

  return (
    <div className="rounded-2xl bg-gray-50 border border-border p-4">
      <div className="flex items-start gap-3">
        <span className="text-xl shrink-0">🤖</span>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-teal uppercase tracking-wide mb-2">
            Prediksi Minggu Depan
          </p>
          <p className="text-lg font-semibold font-display text-ink mb-2">
            ~{forecast.predictedTotal} laporan baru diprediksi
          </p>

          {forecast.recommendation && (
            <div className="flex items-start gap-2 mb-2">
              <span className="text-amber-600 shrink-0">⚠</span>
              <p className="text-sm text-amber-800 leading-relaxed">
                {forecast.recommendation}
              </p>
            </div>
          )}

          <p className="text-xs text-muted">
            Berdasarkan tren 90 hari terakhir
          </p>
        </div>
      </div>
    </div>
  );
}
