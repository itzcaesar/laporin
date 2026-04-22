// ── components/dashboard/gov/charts/SlaRing.tsx ──
"use client";

import { ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

type SlaRingProps = {
  onTime: number;
  breached: number;
  isLoading?: boolean;
};

export function SlaRing({ onTime, breached, isLoading = false }: SlaRingProps) {
  if (isLoading) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-sm border border-border">
        <div className="h-6 w-32 rounded bg-gray-200 animate-pulse mb-4" />
        <div className="h-[200px] rounded bg-gray-100 animate-pulse" />
      </div>
    );
  }

  const total = onTime + breached;
  const onTimePercent = total > 0 ? Math.round((onTime / total) * 100) : 0;

  const data = [
    { name: "On-Time", value: onTime, color: "#10B981" },
    { name: "Terlampaui", value: breached, color: "#DC2626" },
  ];

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm border border-border">
      <h3 className="text-base font-semibold font-display text-navy mb-4">
        Kepatuhan SLA
      </h3>
      <div className="relative">
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        {/* Center Label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div className="text-2xl font-bold text-navy">{onTimePercent}%</div>
          <div className="text-xs text-muted">On-Time</div>
        </div>
      </div>
      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-4">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-green-500" />
          <span className="text-xs text-muted">On-Time</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-red-600" />
          <span className="text-xs text-muted">Terlampaui</span>
        </div>
      </div>
    </div>
  );
}
