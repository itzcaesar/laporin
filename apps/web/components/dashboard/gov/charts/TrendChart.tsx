// ── components/dashboard/gov/charts/TrendChart.tsx ──
"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

type TrendData = {
  date: string;
  count: number;
};

type TrendChartProps = {
  data: TrendData[];
  isLoading?: boolean;
};

export function TrendChart({ data, isLoading = false }: TrendChartProps) {
  if (isLoading) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-sm border border-border">
        <div className="h-6 w-32 rounded bg-gray-200 animate-pulse mb-4" />
        <div className="h-[280px] rounded bg-gray-100 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm border border-border">
      <h3 className="text-base font-semibold font-display text-navy mb-4">
        Tren Laporan
      </h3>
      <ResponsiveContainer width="100%" height={280} minWidth={0} minHeight={0}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12, fill: "#6B7280" }}
            stroke="#E5E7EB"
          />
          <YAxis tick={{ fontSize: 12, fill: "#6B7280" }} stroke="#E5E7EB" />
          <Tooltip
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #E5E7EB",
              borderRadius: "12px",
              boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
              fontSize: "14px",
            }}
            labelStyle={{ color: "#111827", fontWeight: 600 }}
            formatter={(value) => [`${value} laporan`, "Jumlah"]}
          />
          <Line
            type="monotone"
            dataKey="count"
            stroke="#2563EB"
            strokeWidth={2}
            dot={{ fill: "#2563EB", r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
