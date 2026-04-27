// ── app/citizen/bookmarks/page.tsx ──
// Bookmarks page - shows user's bookmarked reports

"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { api, ApiClientError } from "@/lib/api-client";
import EmptyState from "@/components/dashboard/shared/EmptyState";
import LoadingSkeleton from "@/components/dashboard/shared/LoadingSkeleton";
import { ReportCard } from "@/components/dashboard/citizen/ReportCard";
import { useRouter } from "next/navigation";
import type { Report, ApiResponse, PaginationMeta } from '@laporin/types';

export default function BookmarksPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [bookmarks, setBookmarks] = useState<Report[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBookmarks = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await api.get<ApiResponse<Report[]>>('/user/bookmarks');
      setBookmarks(res.data);
      setMeta(res.meta ?? null);
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.userMessage
          : "Gagal memuat bookmark"
      );
      setBookmarks([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchBookmarks();
    }
  }, [user, fetchBookmarks]);

  return (
    <div className="dashboard-page">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-display text-navy">Bookmark</h1>
        <p className="text-sm text-muted mt-1">
          Laporan yang kamu simpan untuk dipantau
        </p>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <LoadingSkeleton key={i} variant="report-card" />
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-red-700 text-sm">
          {error}
          <button onClick={fetchBookmarks} className="ml-2 underline font-medium">
            Coba lagi
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && bookmarks.length === 0 && (
        <EmptyState
          icon="🔖"
          title="Belum ada bookmark"
          description="Simpan laporan yang ingin kamu pantau dengan menekan ikon bookmark pada laporan."
          action={{ label: "Lihat Semua Laporan", href: "/citizen" }}
        />
      )}

      {/* Bookmark List - Grid on Desktop */}
      {!isLoading && !error && bookmarks.length > 0 && (
        <>
          <div className="mb-4 text-sm text-muted">
            {bookmarks.length} laporan disimpan
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {bookmarks.map((report) => (
              <ReportCard key={report.id} report={report} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
