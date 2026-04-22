// ── hooks/useGovDashboard.ts ──
"use client";

import { useState, useEffect } from "react";
import { useApiError } from "./useApiError";
// import { api } from "@/lib/api-client";

type DashboardStats = {
  totalReports: number;
  newToday: number;
  slaBreached: number;
  satisfactionAvg: number;
  recentReports: Array<{
    id: string;
    trackingCode: string;
    status: string;
    categoryName: string;
    categoryEmoji: string;
    locationAddress: string;
    createdAt: string;
  }>;
};

type UrgentReport = {
  id: string;
  title: string;
  locationAddress: string;
};

type WorkloadForecast = {
  predictedTotal: number;
  recommendation: string | null;
};

type DashboardData = {
  stats: DashboardStats | null;
  urgentReports: UrgentReport[];
  workloadForecast: WorkloadForecast | null;
  aiInsight: string | null;
  isLoading: boolean;
  error: string | null;
  retry: () => void;
};

// Mock data for development - replace with API calls when backend is ready
const MOCK_STATS: DashboardStats = {
  totalReports: 1247,
  newToday: 23,
  slaBreached: 8,
  satisfactionAvg: 4.7,
  recentReports: [
    {
      id: "1",
      trackingCode: "LP-2026-BDG-00142",
      status: "Diproses",
      categoryName: "Jalan Rusak",
      categoryEmoji: "🛣",
      locationAddress: "Jl. Sudirman No.12, Kel. Braga",
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "2",
      trackingCode: "LP-2026-BDG-00141",
      status: "Baru",
      categoryName: "Drainase",
      categoryEmoji: "🌊",
      locationAddress: "Jl. Asia Afrika No.45",
      createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "3",
      trackingCode: "LP-2026-BDG-00140",
      status: "Diverifikasi",
      categoryName: "Lampu Lalu Lintas",
      categoryEmoji: "🚦",
      locationAddress: "Jl. Dago No.88",
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "4",
      trackingCode: "LP-2026-BDG-00139",
      status: "Selesai",
      categoryName: "Trotoar Disabilitas",
      categoryEmoji: "♿",
      locationAddress: "Jl. Cihampelas No.23",
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "5",
      trackingCode: "LP-2026-BDG-00138",
      status: "Diproses",
      categoryName: "Taman Kota",
      categoryEmoji: "🌳",
      locationAddress: "Taman Lansia, Kel. Cicendo",
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ],
};

const MOCK_URGENT_REPORTS: UrgentReport[] = [
  {
    id: "urgent-1",
    title: "Jembatan Cisangkan — risiko struktural",
    locationAddress: "Jl. Cisangkan, Kec. Cimahi",
  },
  {
    id: "urgent-2",
    title: "Banjir Jl. Ahmad Yani — aktif",
    locationAddress: "Jl. Ahmad Yani, Kel. Cicadas",
  },
];

const MOCK_WORKLOAD_FORECAST: WorkloadForecast = {
  predictedTotal: 34,
  recommendation: "Pertimbangkan menambah 2 petugas di Kec. Coblong",
};

const MOCK_AI_INSIGHT =
  "Kerusakan drainase di Kec. Cicendo meningkat 40% dalam 30 hari terakhir. Pertimbangkan inspeksi preventif sebelum musim hujan.";

export function useGovDashboard(): DashboardData {
  const { handleError, clearError } = useApiError();
  const [data, setData] = useState<Omit<DashboardData, 'retry'>>({
    stats: null,
    urgentReports: [],
    workloadForecast: null,
    aiInsight: null,
    isLoading: true,
    error: null,
  });

  const fetchData = () => {
    setData(prev => ({ ...prev, isLoading: true, error: null }));
    clearError();

    // Simulate API call with delay
    const timer = setTimeout(() => {
      setData({
        stats: MOCK_STATS,
        urgentReports: MOCK_URGENT_REPORTS,
        workloadForecast: MOCK_WORKLOAD_FORECAST,
        aiInsight: MOCK_AI_INSIGHT,
        isLoading: false,
        error: null,
      });
    }, 800);

    return () => clearTimeout(timer);

    // TODO: Replace with actual API calls when backend is ready
    // const loadData = async () => {
    //   try {
    //     const [statsRes, forecastRes] = await Promise.all([
    //       api.get<{ data: DashboardStats & { urgentReports: UrgentReport[]; aiInsight: string } }>(
    //         "/gov/dashboard/stats"
    //       ),
    //       api.get<{ data: WorkloadForecast }>("/gov/dashboard/workload-forecast"),
    //     ]);
    //     setData({
    //       stats: statsRes.data,
    //       urgentReports: statsRes.data.urgentReports || [],
    //       aiInsight: statsRes.data.aiInsight || null,
    //       workloadForecast: forecastRes.data,
    //       isLoading: false,
    //       error: null,
    //     });
    //   } catch (err) {
    //     handleError(err);
    //     setData((prev) => ({
    //       ...prev,
    //       isLoading: false,
    //       error: "Gagal memuat data dashboard",
    //     }));
    //   }
    // };
    // loadData();
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    ...data,
    retry: fetchData,
  };
}
