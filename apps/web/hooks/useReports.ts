// ── hooks/useReports.ts ──
// Fetches paginated report list from the API

"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api-client";
import type { Report, ListReportsMeta } from "@/types";

interface UseReportsParams {
  status?: string;
  categoryId?: number;
  page?: number;
  limit?: number;
  search?: string;
}

/**
 * Fetches paginated report list from the API. Refetches automatically when params change.
 */
export function useReports(params: UseReportsParams = {}) {
  const [reports, setReports] = useState<Report[]>([]);
  const [meta, setMeta] = useState<ListReportsMeta | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const query = new URLSearchParams(
    Object.entries(params)
      .filter(([, value]) => value != null)
      .map(([key, value]) => [key, String(value)])
  ).toString();

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<{ data: Report[]; meta: ListReportsMeta }>(
        `/reports?${query}`
      );
      setReports(res.data);
      setMeta(res.meta);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal memuat laporan"
      );
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  return { reports, meta, isLoading, error, refetch: fetchReports };
}
