// ── components/dashboard/gov/charts/SatisfactionGauge.tsx ──
"use client";

import {
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
} from "recharts";

type SatisfactionGaugeProps = {
  score: number; // 0-5
  isLoading?: boolean;
};

export function SatisfactionGauge({
  score,
  isLoading = false,
}: SatisfactionGaugeProps) {
  if (isLoading) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-sm border border-border">
        <div className="h-6 w-32 rounded bg-gray-200 animate-pulse mb-4" />
        <div className="h-[200px] rounded bg-gray-100 animate-pulse" />
      </div>
    );
  }

  const percentage = (score / 5) * 100;

  // Determine color based on score
  const getColor = () => {
    if (score >= 4.5) return "#10B981"; // green
    if (score >= 4.0) return "#3B82F6"; // blue
    if (score >= 3.5) return "#F59E0B"; // amber
    return "#DC2626"; // red
  };

  const data = [
    {
      name: "Satisfaction",
      value: percentage,
      fill: getColor(),
    },
  ];

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm border border-border">
      <h3 className="text-base font-semibold font-display text-navy mb-4">
        Kepuasan Warga
      </h3>
      <div className="relative">
        <ResponsiveContainer width="100%" height={200}>
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius="60%"
            outerRadius="90%"
            data={data}
            startAngle={180}
            endAngle={0}
          >
            <PolarAngleAxis
              type="number"
              domain={[0, 100]}
              angleAxisId={0}
              tick={false}
            />
            <RadialBar
              background={{ fill: "#E5E7EB" }}
              dataKey="value"
              cornerRadius={10}
            />
          </RadialBarChart>
        </ResponsiveContainer>
        {/* Center Label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div className="text-2xl font-bold text-navy">{score.toFixed(1)}</div>
          <div className="text-xs text-muted">/ 5.0</div>
          <div className="text-xs text-muted mt-1">Kepuasan</div>
        </div>
      </div>
    </div>
  );
}
