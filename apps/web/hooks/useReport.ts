// ── hooks/useReport.ts ──
// Fetches a single report's full detail by ID

"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api-client";
import type { ReportDetail } from "@/types";

/**
 * Fetches a single report's full detail by ID.
 */
export function useReport(id: string) {
  const [report, setReport] = useState<ReportDetail | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<{ data: ReportDetail }>(`/reports/${id}`);
      setReport(res.data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal memuat detail laporan"
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  return { report, isLoading, error, refetch: fetchReport };
}
