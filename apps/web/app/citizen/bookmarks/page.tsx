// ── app/citizen/bookmarks/page.tsx ──
// Bookmarks page

"use client";

import { useState, useMemo } from "react";
import { MOCK_REPORTS } from "@/data/mock-reports";
import { mockToReport } from "@/lib/mock-adapter";
import { EmptyState } from "@/components/dashboard/shared/EmptyState";
import { ReportCard } from "@/components/dashboard/citizen/ReportCard";
import { Bookmark } from "lucide-react";
import { useRouter } from "next/navigation";

export default function BookmarksPage() {
  const router = useRouter();
  
  // For demo purposes, show reports 5-8 as bookmarked
  const bookmarks = useMemo(() => {
    return MOCK_REPORTS.slice(5, 9).map(mockToReport);
  }, []);

  return (
    <div className="dashboard-page max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-display text-navy">
          Bookmark
        </h1>
        <p className="text-sm text-muted mt-1">
          Laporan yang kamu simpan untuk dipantau
        </p>
      </div>

      {/* Empty State */}
      {bookmarks.length === 0 && (
        <EmptyState
          icon={Bookmark}
          title="Belum ada bookmark"
          description="Simpan laporan yang ingin kamu pantau dengan menekan ikon bookmark pada laporan."
          actionLabel="Lihat Semua Laporan"
          onAction={() => router.push("/citizen")}
        />
      )}

      {/* Bookmark List - Grid on Desktop */}
      {bookmarks.length > 0 && (
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
