// ── hooks/useGovDashboard.ts ──
// Fetches government dashboard KPI stats

"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api-client";
import type { DashboardStats } from "@/types";

/**
 * Fetches government dashboard KPI stats. Cached 60s on API.
 */
export function useGovDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<{ data: DashboardStats }>("/gov/dashboard/stats")
      .then((res) => setStats(res.data))
      .catch((err: unknown) =>
        setError(
          err instanceof Error ? err.message : "Gagal memuat dasbor"
        )
      )
      .finally(() => setLoading(false));
  }, []);

  return { stats, isLoading, error };
}
