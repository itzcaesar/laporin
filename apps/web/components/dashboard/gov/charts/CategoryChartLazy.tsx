// ── components/dashboard/gov/charts/CategoryChartLazy.tsx ──
// Lazy-loaded category distribution chart

'use client'
import { 
  BarChart, Bar, XAxis, YAxis, 
  Tooltip, ResponsiveContainer, Cell 
} from "recharts";

interface CategoryData {
  name: string;
  count: number;
}

interface CategoryChartProps {
  data: CategoryData[];
}

const chartColors = ["#2563EB", "#7C3AED", "#DB2777", "#EA580C", "#059669"];

export function CategoryChartLazy({ data }: CategoryChartProps) {
  return (
    <div className="rounded-2xl bg-white border border-border p-6 shadow-sm">
      <div className="mb-4">
        <h2 className="text-sm font-bold text-navy flex items-center gap-2">
          <svg className="w-4 h-4 text-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Kategori Teratas
        </h2>
        <p className="text-[10px] text-muted">Berdasarkan volume laporan</p>
      </div>
      <div className="h-[180px] md:h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
          <BarChart data={data} layout="vertical">
            <XAxis type="number" hide />
            <YAxis 
              dataKey="name" 
              type="category" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: "#4B5563", fontWeight: 500 }}
              width={100}
            />
            <Tooltip cursor={{ fill: 'transparent' }} />
            <Bar dataKey="count" radius={[0, 4, 4, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
