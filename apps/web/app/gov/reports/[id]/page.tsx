// ── app/gov/reports/[id]/page.tsx ──
"use client";

import { useState } from "react";
import { api } from "@/lib/api-client";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, MapPin } from "lucide-react";
import { AiAnalysisCard } from "@/components/dashboard/gov/AiAnalysisCard";
import { ActionPanel } from "@/components/dashboard/gov/ActionPanel";
import { GovCommentThread } from "@/components/dashboard/gov/GovCommentThread";
import { ImageLightbox } from "@/components/dashboard/gov/ImageLightbox";
import { formatRelativeTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useGovReport, useGovReportActions } from "@/hooks/useGovReport";
import LoadingSkeleton from "@/components/dashboard/shared/LoadingSkeleton";
import EmptyState from "@/components/dashboard/shared/EmptyState";
import type { Comment } from '@laporin/types';
import dynamic from "next/dynamic";

const StaticMap = dynamic(
  () => import("@/components/map/StaticMap"),
  { ssr: false }
);

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
  const reportId = params.id as string;
  
  // Fetch report data
  const { data: reportData, isLoading, error, refetch } = useGovReport(reportId);
  
  // Action handlers
  const actions = useGovReportActions(reportId, refetch);
  
  const [isActionPanelOpen, setIsActionPanelOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Helper functions
  const getDangerLabel = (level: number): string => {
    if (level >= 4) return "Sangat Berbahaya";
    if (level === 3) return "Signifikan";
    if (level === 2) return "Sedang";
    return "Rendah";
  };

  const getPriorityLabel = (priority: string): string => {
    return PRIORITY_LABELS[priority as keyof typeof PRIORITY_LABELS] || priority;
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Transform API data to UI format
  const report = reportData ? {
    id: reportData.id,
    trackingCode: reportData.trackingCode,
    title: reportData.title,
    categoryEmoji: reportData.category.emoji,
    categoryName: reportData.category.name,
    description: reportData.description,
    locationAddress: reportData.locationAddress,
    locationLat: reportData.locationLat,
    locationLng: reportData.locationLng,
    status: reportData.status,
    priority: reportData.priority,
    dangerLevel: reportData.dangerLevel,
    picName: reportData.assignedOfficer?.name || null,
    picNip: reportData.picNip,
    createdAt: reportData.createdAt,
    media: reportData.media,
    aiAnalysis: reportData.aiAnalysis ? {
      categoryDetected: {
        emoji: reportData.category.emoji,
        name: reportData.category.name,
        confidence: reportData.aiAnalysis.suggestedCategory === reportData.categoryId
          ? 95  // AI matched the assigned category — high confidence
          : reportData.aiAnalysis.suggestedCategory
            ? 60  // AI suggested a different category
            : 80, // AI didn't suggest a category — moderate confidence
      },
      dangerLevel: reportData.aiAnalysis.dangerLevel ?? reportData.dangerLevel,
      dangerLabel: getDangerLabel(reportData.aiAnalysis.dangerLevel ?? reportData.dangerLevel),
      priorityScore: reportData.aiAnalysis.priorityScore ?? reportData.priorityScore,
      priorityLabel: getPriorityLabel(reportData.priority),
      hoaxConfidence: reportData.aiAnalysis.hoaxConfidence ?? 0,
      budgetEstimate: reportData.aiAnalysis.budgetEstimate ? {
        minIdr: Math.floor(Number(reportData.aiAnalysis.budgetEstimate) * 0.8),
        maxIdr: Math.ceil(Number(reportData.aiAnalysis.budgetEstimate) * 1.2),
        basis: "Estimasi AI berdasarkan kategori, lokasi, dan tingkat kerusakan",
      } : null,
      impactSummary: reportData.aiAnalysis.impactSummary || null,
      beforeAfterVerification: null,
    } : null,
    comments: reportData.comments.map(c => ({
      id: c.id,
      content: c.content,
      authorName: c.author?.name || "Anonim",
      isGovernment: c.isGovernment || c.author?.role === 'officer' || c.author?.role === 'admin',
      upvoteCount: 0,
      parentId: null,
      createdAt: c.createdAt,
      replies: (c.replies ?? []).map(r => ({
        id: r.id,
        content: r.content,
        authorName: r.author?.name || "Anonim",
        isGovernment: r.isGovernment || r.author?.role === 'officer' || r.author?.role === 'admin',
        upvoteCount: 0,
        parentId: c.id,
        createdAt: r.createdAt,
        replies: [],
      })),
    })),
    statusHistory: reportData.statusHistory.map(h => ({
      id: h.id,
      oldStatus: h.oldStatus,
      newStatus: h.newStatus,
      note: h.note,
      officerNip: h.officerNip,
      changedBy: h.changedBy?.name || "System",
      createdAt: h.createdAt,
    })),
  } : null;

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface">
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
          <LoadingSkeleton variant="report-detail" rows={1} />
        </div>
      </div>
    );
  }

  // Error state
  if (error || !report) {
    return (
      <div className="min-h-screen bg-surface">
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
        <div className="p-4 md:p-6 lg:px-8 flex items-center justify-center min-h-[60vh]">
          <EmptyState
            icon="⚠️"
            title="Gagal memuat laporan"
            description={error || "Laporan tidak ditemukan"}
            actionLabel="Coba Lagi"
            onAction={refetch}
          />
        </div>
      </div>
    );
  }

  const handleReply = async (commentId: string, content: string) => {
    try {
      await api.post(`/reports/${reportId}/comments`, {
        content,
        parentId: commentId,
      });
      // Refetch report to get updated comments
      await refetch();
    } catch (err) {
      console.error('Failed to reply:', err);
      throw err;
    }
  };

  // Calculate SLA status
  const calculateSlaStatus = () => {
    if (!reportData) return { targetDate: "-", daysRemaining: 0, isBreached: false };
    
    const slaHours: Record<string, number> = {
      urgent: 48,    // 2 days
      high: 168,     // 7 days
      medium: 336,   // 14 days
      low: 720,      // 30 days
    };
    
    const hours = slaHours[reportData.priority] || 720;
    const createdDate = new Date(reportData.createdAt);
    const targetDate = new Date(createdDate.getTime() + hours * 60 * 60 * 1000);
    const now = new Date();
    const daysRemaining = Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      targetDate: targetDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
      daysRemaining,
      isBreached: daysRemaining < 0,
    };
  };

  // Get recent audit actions
  const getRecentAuditActions = () => {
    if (!reportData) return [];
    
    return reportData.statusHistory
      .slice(0, 3)
      .map(h => ({
        time: new Date(h.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        officer: h.changedBy?.name || "System",
        action: STATUS_LABELS[h.newStatus] || h.newStatus,
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
                {report.media.map((media, index) => (
                  <button
                    key={media.id}
                    onClick={() => setLightboxIndex(index)}
                    className="flex-shrink-0 group cursor-pointer"
                  >
                    <div className="relative">
                      <img
                        src={media.fileUrl}
                        alt={media.mediaType}
                        className="h-32 w-48 rounded-lg object-cover border border-border group-hover:opacity-90 transition-opacity"
                      />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 rounded-lg">
                        <span className="text-white text-sm font-medium">Klik untuk perbesar</span>
                      </div>
                    </div>
                    <p className="mt-1 text-xs text-muted text-center">
                      {media.mediaType}
                    </p>
                  </button>
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
              <div className="mb-3">
                {report.locationLat && report.locationLng ? (
                  <StaticMap lat={report.locationLat} lng={report.locationLng} />
                ) : (
                  <div className="rounded-xl bg-gray-200 h-48 flex items-center justify-center text-muted">
                    <MapPin size={32} />
                  </div>
                )}
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
                hoaxConfidence={report.aiAnalysis?.hoaxConfidence ?? 0}
                slaStatus={calculateSlaStatus()}
                recentAuditActions={getRecentAuditActions()}
                actions={actions}
                onSuccess={(message) => showToast(message, 'success')}
                onError={(message) => showToast(message, 'error')}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Action Panel Button – sits above the bottom nav */}
      <button
        type="button"
        onClick={() => setIsActionPanelOpen(true)}
        className="fixed bottom-20 left-4 right-4 z-30 rounded-xl bg-navy px-6 py-3 text-sm font-bold text-white shadow-xl hover:bg-navy/90 transition-all btn-interactive lg:hidden flex items-center justify-center gap-2"
      >
        <span>Panel Aksi</span>
        <span className="text-white/60">▾</span>
      </button>

      {/* Mobile Action Panel Bottom Sheet */}
      {isActionPanelOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
            onClick={() => setIsActionPanelOpen(false)}
          />
          <div className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-surface lg:hidden"
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
          >
            {/* Handle */}
            <div className="sticky top-0 bg-surface pt-3 pb-2 px-6 border-b border-border/50">
              <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-border" />
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold font-display text-navy">
                  Panel Aksi
                </h3>
                <button
                  type="button"
                  onClick={() => setIsActionPanelOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-2 text-muted hover:text-ink transition-colors text-lg leading-none"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-4">
              <ActionPanel
                reportId={report.id}
                status={report.status as any}
                hasPic={!!report.picName}
                hoaxConfidence={report.aiAnalysis?.hoaxConfidence ?? 0}
                slaStatus={calculateSlaStatus()}
                recentAuditActions={getRecentAuditActions()}
                actions={actions}
                onSuccess={(message) => showToast(message, 'success')}
                onError={(message) => showToast(message, 'error')}
              />
            </div>
          </div>
        </>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-36 lg:bottom-6 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
          <div className={cn(
            "rounded-xl px-6 py-3 shadow-lg text-sm font-medium text-white whitespace-nowrap",
            toast.type === 'success' ? "bg-green-600" : "bg-red-600"
          )}>
            {toast.message}
          </div>
        </div>
      )}

      {/* Image Lightbox */}
      {lightboxIndex !== null && (
        <ImageLightbox
          images={report.media}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNext={() => setLightboxIndex((lightboxIndex + 1) % report.media.length)}
          onPrev={() => setLightboxIndex((lightboxIndex - 1 + report.media.length) % report.media.length)}
        />
      )}
    </div>
  );
}
