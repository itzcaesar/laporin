// ── app/gov/reports/[id]/page.tsx ──
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, MapPin } from "lucide-react";
import { AiAnalysisCard } from "@/components/dashboard/gov/AiAnalysisCard";
import { ActionPanel } from "@/components/dashboard/gov/ActionPanel";
import { GovCommentThread } from "@/components/dashboard/gov/GovCommentThread";
import { formatRelativeTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

// Mock data - replace with API call
const MOCK_REPORT = {
  id: "1",
  trackingCode: "LP-2026-BDG-00142",
  title: "Jalan Rusak",
  categoryEmoji: "🛣",
  categoryName: "Jalan Rusak",
  description:
    "Jalan berlubang besar di depan rumah saya. Sudah dari kemarin hujan makin parah. Takut motor saya jatuh, kasian juga anak-anak yang lewat sini untuk pergi ke sekolah.",
  locationAddress: "Jl. Sudirman No.12, Kel. Braga, Kec. Sumur Bandung",
  locationLat: -6.9175,
  locationLng: 107.6191,
  status: "in_progress",
  priority: "urgent",
  dangerLevel: 3,
  picName: "Budi Santosa",
  picNip: "198512341234567890",
  createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  media: [
    {
      id: "1",
      mediaType: "photo",
      fileUrl: "https://placehold.co/400x300/e5e7eb/6b7280?text=Foto+Laporan",
    },
  ],
  aiAnalysis: {
    categoryDetected: {
      emoji: "🛣",
      name: "Jalan Rusak",
      confidence: 95,
    },
    dangerLevel: 3,
    dangerLabel: "Signifikan",
    priorityScore: 72,
    priorityLabel: "Tinggi",
    hoaxConfidence: 2,
    budgetEstimate: {
      minIdr: 8000000,
      maxIdr: 15000000,
      basis: "Perbaikan jalan berlubang (±50cm), lokasi perkotaan",
    },
    impactSummary:
      "Lubang berukuran ±50cm ini berpotensi membahayakan sekitar 500 pengguna jalan harian. Lokasi dekat sekolah meningkatkan risiko kecelakaan anak-anak.",
    beforeAfterVerification: null,
  },
  comments: [
    {
      id: "1",
      content: "Sudah 3 hari belum ada tindakan. Mohon segera ditangani.",
      authorName: "Ahmad Rizki",
      isGovernment: false,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      replies: [
        {
          id: "2",
          content:
            "Terima kasih atas laporannya. Tim kami sudah meninjau lokasi dan akan segera melakukan perbaikan dalam 2 hari ke depan.",
          authorName: "Budi Santosa",
          isGovernment: true,
          createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          replies: [],
        },
      ],
    },
  ],
  statusHistory: [
    {
      id: "1",
      oldStatus: "verified",
      newStatus: "in_progress",
      note: "PIC ditugaskan, pekerjaan dimulai",
      officerNip: "198512341234567890",
      changedBy: "Budi Santosa",
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "2",
      oldStatus: "new",
      newStatus: "verified",
      note: "Laporan valid, akan ditindaklanjuti",
      officerNip: "199012341234567890",
      changedBy: "Agus Permana",
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    },
  ],
};

const STATUS_LABELS: Record<string, string> = {
  new: "Baru",
  verified: "Diverifikasi",
  in_progress: "Diproses",
  completed: "Selesai",
  verified_complete: "Terverifikasi Selesai",
  rejected: "Ditolak",
  closed: "Ditutup",
};

const PRIORITY_COLORS = {
  low: "bg-gray-100 text-gray-700",
  medium: "bg-amber-100 text-amber-700",
  high: "bg-orange-100 text-orange-700",
  urgent: "bg-red-100 text-red-700",
} as const;

const PRIORITY_LABELS = {
  low: "Rendah",
  medium: "Sedang",
  high: "Tinggi",
  urgent: "Darurat",
} as const;

export default function GovReportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [report, setReport] = useState(MOCK_REPORT);
  const [isActionPanelOpen, setIsActionPanelOpen] = useState(false);

  const handleReply = async (commentId: string, content: string) => {
    // TODO: API call to POST /gov/comments/{reportId}/reply
    console.log("Reply to", commentId, ":", content);
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Create new reply
    const newReply: typeof report.comments[0] = {
      id: `reply-${Date.now()}`,
      content,
      authorName: user?.name || "Petugas",
      isGovernment: true,
      createdAt: new Date().toISOString(),
      replies: [],
    };

    // Update comments with new reply
    setReport((prev) => ({
      ...prev,
      comments: prev.comments.map((comment) =>
        comment.id === commentId
          ? { ...comment, replies: [...comment.replies, newReply] }
          : comment
      ),
    }));
  };

  return (
    <div className="min-h-screen bg-surface">
      {/* Back Button */}
      <div className="border-b border-border bg-white px-4 py-3 md:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm font-medium text-blue hover:text-blue/80 transition-colors"
        >
          <ArrowLeft size={16} />
          Kembali ke Daftar
        </button>
      </div>

      <div className="p-4 md:p-6 lg:p-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left Column - Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <div className="rounded-2xl bg-white p-6 shadow-sm border border-border">
              <div className="flex items-start gap-3 mb-4">
                <span className="text-4xl">{report.categoryEmoji}</span>
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl font-bold font-display text-navy mb-2">
                    {report.title}
                  </h1>
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className="font-mono text-sm text-muted">
                      {report.trackingCode}
                    </span>
                    <span className="text-muted">·</span>
                    <span className="text-sm text-muted">
                      {formatRelativeTime(report.createdAt)}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-semibold",
                        "bg-blue-100 text-blue-700"
                      )}
                    >
                      {STATUS_LABELS[report.status]}
                    </span>
                    <span
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-semibold",
                        PRIORITY_COLORS[report.priority as keyof typeof PRIORITY_COLORS]
                      )}
                    >
                      {PRIORITY_LABELS[report.priority as keyof typeof PRIORITY_LABELS]}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Photo Gallery */}
            <div className="rounded-2xl bg-white p-6 shadow-sm border border-border">
              <h2 className="text-base font-semibold font-display text-navy mb-4">
                Foto Laporan
              </h2>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {report.media.map((media) => (
                  <div key={media.id} className="flex-shrink-0">
                    <img
                      src={media.fileUrl}
                      alt={media.mediaType}
                      className="h-32 w-48 rounded-lg object-cover border border-border"
                    />
                    <p className="mt-1 text-xs text-muted text-center">
                      {media.mediaType}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="rounded-2xl bg-white p-6 shadow-sm border border-border">
              <h2 className="text-base font-semibold font-display text-navy mb-3">
                Deskripsi Warga
              </h2>
              <p className="text-sm text-ink leading-relaxed">
                {report.description}
              </p>
            </div>

            {/* AI Analysis Card */}
            <AiAnalysisCard
              reportId={report.id}
              analysis={report.aiAnalysis}
              onRefresh={async () => {
                console.log("Refreshing AI analysis...");
                await new Promise((resolve) => setTimeout(resolve, 1000));
              }}
            />

            {/* Location */}
            <div className="rounded-2xl bg-white p-6 shadow-sm border border-border">
              <h2 className="text-base font-semibold font-display text-navy mb-4">
                Lokasi
              </h2>
              <div className="rounded-xl bg-gray-200 h-48 mb-3 flex items-center justify-center text-muted">
                <MapPin size={32} />
              </div>
              <p className="text-sm text-ink mb-1">{report.locationAddress}</p>
              <p className="text-xs text-muted">
                [{report.locationLat}, {report.locationLng}]
              </p>
            </div>

            {/* Status Timeline */}
            <div className="rounded-2xl bg-white p-6 shadow-sm border border-border">
              <h2 className="text-base font-semibold font-display text-navy mb-4">
                Riwayat Status
              </h2>
              <div className="space-y-4">
                {report.statusHistory.map((history, index) => (
                  <div key={history.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue text-white text-xs font-bold">
                        {report.statusHistory.length - index}
                      </div>
                      {index < report.statusHistory.length - 1 && (
                        <div className="w-0.5 flex-1 bg-border mt-2" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <p className="text-sm font-semibold text-ink mb-1">
                        {STATUS_LABELS[history.newStatus]}
                      </p>
                      <p className="text-xs text-muted mb-1">
                        {history.changedBy} ·{" "}
                        {formatRelativeTime(history.createdAt)}
                      </p>
                      <p className="text-sm text-ink">{history.note}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Comments */}
            <div className="rounded-2xl bg-white p-6 shadow-sm border border-border">
              <h2 className="text-base font-semibold font-display text-navy mb-4">
                Komentar Warga ({report.comments.length})
              </h2>
              <GovCommentThread
                comments={report.comments}
                onReply={handleReply}
              />
            </div>
          </div>

          {/* Right Column - Action Panel (Desktop) */}
          <div className="hidden lg:block">
            <div className="sticky top-20">
              <ActionPanel
                reportId={report.id}
                status={report.status as any}
                hasPic={!!report.picName}
                hoaxConfidence={report.aiAnalysis.hoaxConfidence}
                slaStatus={{
                  targetDate: "20 Jan 2026",
                  daysRemaining: -3,
                  isBreached: true,
                }}
                recentAuditActions={[
                  { time: "14:32", officer: "Agus P.", action: "Diverifikasi" },
                  { time: "10:15", officer: "Budi S.", action: "PIC ditugaskan" },
                  { time: "09:00", officer: "System", action: "Laporan dibuat" },
                ]}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Action Panel Button */}
      <button
        type="button"
        onClick={() => setIsActionPanelOpen(true)}
        className="fixed bottom-4 left-4 right-4 z-30 rounded-xl bg-navy px-6 py-3 text-sm font-medium text-white shadow-lg hover:bg-navy/90 transition-colors lg:hidden"
      >
        Panel Aksi ▾
      </button>

      {/* Mobile Action Panel Bottom Sheet */}
      {isActionPanelOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setIsActionPanelOpen(false)}
          />
          <div className="fixed inset-x-0 bottom-0 z-50 max-h-[80vh] overflow-y-auto rounded-t-2xl bg-surface p-6 lg:hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold font-display text-navy">
                Panel Aksi
              </h3>
              <button
                type="button"
                onClick={() => setIsActionPanelOpen(false)}
                className="text-muted hover:text-ink transition-colors"
              >
                ✕
              </button>
            </div>
            <ActionPanel
              reportId={report.id}
              status={report.status as any}
              hasPic={!!report.picName}
              hoaxConfidence={report.aiAnalysis.hoaxConfidence}
              slaStatus={{
                targetDate: "20 Jan 2026",
                daysRemaining: -3,
                isBreached: true,
              }}
              recentAuditActions={[
                { time: "14:32", officer: "Agus P.", action: "Diverifikasi" },
                { time: "10:15", officer: "Budi S.", action: "PIC ditugaskan" },
                { time: "09:00", officer: "System", action: "Laporan dibuat" },
              ]}
            />
          </div>
        </>
      )}
    </div>
  );
}
