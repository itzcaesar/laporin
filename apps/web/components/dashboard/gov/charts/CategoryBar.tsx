// ── components/dashboard/gov/charts/CategoryBar.tsx ──
"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

type CategoryData = {
  categoryName: string;
  emoji: string;
  count: number;
};

type CategoryBarProps = {
  data: CategoryData[];
  isLoading?: boolean;
};

export function CategoryBar({ data, isLoading = false }: CategoryBarProps) {
  if (isLoading) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-sm border border-border">
        <div className="h-6 w-32 rounded bg-gray-200 animate-pulse mb-4" />
        <div className="h-[280px] rounded bg-gray-100 animate-pulse" />
      </div>
    );
  }

  // Format data for display
  const formattedData = data.map((item) => ({
    ...item,
    displayName:
      item.categoryName.length > 15
        ? `${item.emoji} ${item.categoryName.substring(0, 15)}...`
        : `${item.emoji} ${item.categoryName}`,
  }));

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm border border-border">
      <h3 className="text-base font-semibold font-display text-navy mb-4">
        Top Kategori
      </h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={formattedData} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis type="number" tick={{ fontSize: 12, fill: "#6B7280" }} />
          <YAxis
            type="category"
            dataKey="displayName"
            tick={{ fontSize: 12, fill: "#6B7280" }}
            width={120}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #E5E7EB",
              borderRadius: "12px",
              boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
              fontSize: "14px",
            }}
            formatter={(value, _name, props) => [
              `${value} laporan`,
              (props.payload as CategoryData & { displayName: string }).categoryName,
            ]}
          />
          <Bar
            dataKey="count"
            fill="url(#colorGradient)"
            radius={[0, 8, 8, 0]}
          />
          <defs>
            <linearGradient id="colorGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#1A3C6E" />
              <stop offset="100%" stopColor="#2563EB" />
            </linearGradient>
          </defs>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
