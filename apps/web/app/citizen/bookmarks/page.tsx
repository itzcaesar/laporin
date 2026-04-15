// ── app/citizen/bookmarks/page.tsx ──
// Bookmarks page

"use client";

import { useState } from "react";
import { LoadingSkeleton } from "@/components/dashboard/shared/LoadingSkeleton";
import { EmptyState } from "@/components/dashboard/shared/EmptyState";
import { ReportCard } from "@/components/dashboard/citizen/ReportCard";
import { Bookmark } from "lucide-react";
import { useRouter } from "next/navigation";

// Mock bookmarked reports - replace with actual API call
const MOCK_BOOKMARKS: any[] = [];

export default function BookmarksPage() {
  const router = useRouter();
  const [bookmarks] = useState(MOCK_BOOKMARKS);
  const [isLoading] = useState(false);

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

      {/* Loading State */}
      {isLoading && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <LoadingSkeleton variant="report-card" count={6} />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && bookmarks.length === 0 && (
        <EmptyState
          icon={Bookmark}
          title="Belum ada bookmark"
          description="Simpan laporan yang ingin kamu pantau dengan menekan ikon bookmark pada laporan."
          actionLabel="Lihat Semua Laporan"
          onAction={() => router.push("/citizen")}
        />
      )}

      {/* Bookmark List - Grid on Desktop */}
      {!isLoading && bookmarks.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {bookmarks.map((report) => (
            <ReportCard key={report.id} report={report} />
          ))}
        </div>
      )}
    </div>
  );
}
