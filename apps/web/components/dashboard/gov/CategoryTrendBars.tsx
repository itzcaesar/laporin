// ── components/dashboard/gov/CategoryTrendBars.tsx ──
"use client";

import { cn } from "@/lib/utils";

type CategoryTrend = {
  emoji: string;
  name: string;
  count: number;
  changePercent: number;
  isIncreasing: boolean;
};

type CategoryTrendBarsProps = {
  trends: CategoryTrend[];
  isLoading?: boolean;
};

export function CategoryTrendBars({
  trends,
  isLoading = false,
}: CategoryTrendBarsProps) {
  if (isLoading) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-sm border border-border">
        <div className="h-6 w-32 rounded bg-gray-200 animate-pulse mb-4" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 rounded bg-gray-100 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // Sort by absolute change descending
  const sortedTrends = [...trends].sort(
    (a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent)
  );

  // Find max count for relative bar width
  const maxCount = Math.max(...trends.map((t) => t.count), 1);

  const getChangeColor = (changePercent: number, isIncreasing: boolean) => {
    if (!isIncreasing) return "text-green-600";
    if (changePercent > 20) return "text-red-600";
    if (changePercent > 10) return "text-amber-600";
    return "text-gray-600";
  };

  const getArrow = (isIncreasing: boolean) => {
    return isIncreasing ? "↑" : "↓";
  };

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm border border-border">
      <h3 className="text-base font-semibold font-display text-navy mb-4">
        Tren Kategori (30 hari)
      </h3>
      <div className="space-y-3">
        {sortedTrends.map((trend) => {
          const barWidth = (trend.count / maxCount) * 100;
          const changeColor = getChangeColor(
            trend.changePercent,
            trend.isIncreasing
          );

          return (
            <div key={trend.name} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{trend.emoji}</span>
                  <span className="font-medium text-ink">{trend.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn("font-semibold", changeColor)}>
                    {getArrow(trend.isIncreasing)}{" "}
                    {trend.isIncreasing ? "+" : ""}
                    {trend.changePercent}%
                  </span>
                  {Math.abs(trend.changePercent) > 20 && (
                    <span className="text-amber-600">⚠</span>
                  )}
                </div>
              </div>
              <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className={cn(
                    "h-full transition-all duration-300",
                    trend.isIncreasing ? "bg-amber-500" : "bg-green-500"
                  )}
                  style={{ width: `${barWidth}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
