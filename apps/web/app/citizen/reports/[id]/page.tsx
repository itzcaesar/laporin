// ── app/citizen/reports/[id]/page.tsx ──
// Individual report detail page

"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useReport } from "@/hooks/useReport";
import { getStatusConfig } from "@/lib/status-config";
import { cn, formatRelativeTime } from "@/lib/utils";
import { api, ApiClientError } from "@/lib/api-client";
import {
  ArrowLeft,
  ArrowBigUp,
  MessageCircle,
  MapPin,
  Calendar,
  User,
  Share2,
  Bookmark,
  Sparkles,
  Image as ImageIcon,
} from "lucide-react";
import Image from "next/image";
import { CommentThread, type Comment } from "@/components/dashboard/shared/CommentThread";
import { useAuth } from "@/hooks/useAuth";
import LoadingSkeleton from "@/components/dashboard/shared/LoadingSkeleton";
import EmptyState from "@/components/dashboard/shared/EmptyState";

export default function ReportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const reportId = params.id as string;
  const { user } = useAuth();
  const { report, isLoading, error, refetch } = useReport(reportId);

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isUpvoting, setIsUpvoting] = useState(false);
  const [isBookmarking, setIsBookmarking] = useState(false);

  // Loading state
  if (isLoading) {
    return (
      <div className="dashboard-page pb-20 md:pb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-navy hover:text-blue mb-4 transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="font-medium">Kembali</span>
        </button>
        <LoadingSkeleton variant="report-detail" />
      </div>
    );
  }

  // Error or not found state
  if (error || !report) {
    return (
      <div className="dashboard-page pb-20 md:pb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-navy hover:text-blue mb-4 transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="font-medium">Kembali</span>
        </button>
        <EmptyState
          icon="❌"
          title="Laporan tidak ditemukan"
          message={error ?? "Laporan ini mungkin telah dihapus atau tidak tersedia."}
          action={{ label: "Kembali ke Feed", href: "/citizen" }}
        />
      </div>
    );
  }

  const statusConfig = getStatusConfig(report.status);

  // Get media URLs from report
  const reportImages = report.media?.map((m) => m.fileUrl) ?? [];

  // Convert API comments to CommentThread format
  const comments: Comment[] = (report.comments ?? []).map((c) => ({
    id: c.id,
    content: c.content,
    authorName: c.authorName,
    isGovernment: c.isGovernment,
    isOfficial: c.isGovernment,
    createdAt: c.createdAt,
    replies: (c.replies ?? []).map((r) => ({
      id: r.id,
      content: r.content,
      authorName: r.authorName,
      isGovernment: r.isGovernment,
      isOfficial: r.isGovernment,
      createdAt: r.createdAt,
      replies: [],
    })),
  }));

  const handleUpvote = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    setIsUpvoting(true);
    try {
      if (report.hasVoted) {
        // Remove upvote
        await api.delete(`/reports/${reportId}/vote`);
      } else {
        // Add upvote
        await api.post(`/reports/${reportId}/vote`, {});
      }
      // Refetch to get updated data
      refetch();
    } catch (err) {
      console.error('Upvote error:', err);
      alert(err instanceof ApiClientError ? err.userMessage : 'Gagal memperbarui vote');
    } finally {
      setIsUpvoting(false);
    }
  };

  const handleBookmark = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    setIsBookmarking(true);
    try {
      if (report.hasBookmarked) {
        // Remove bookmark
        await api.delete(`/user/bookmarks/${reportId}`);
      } else {
        // Add bookmark
        await api.post(`/user/bookmarks/${reportId}`, {});
      }
      // Refetch to get updated data
      refetch();
    } catch (err) {
      console.error('Bookmark error:', err);
      alert(err instanceof ApiClientError ? err.userMessage : 'Gagal memperbarui bookmark');
    } finally {
      setIsBookmarking(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: report.title,
          text: report.description,
          url: window.location.href,
        });
      } catch (err) {
        console.log("Share cancelled");
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert("Link disalin ke clipboard!");
    }
  };

  const handleAddComment = async (content: string) => {
    if (!user) {
      router.push('/login');
      return;
    }

    try {
      await api.post(`/reports/${reportId}/comments`, { content });
      // Refetch to get updated comments
      refetch();
    } catch (err) {
      console.error('Add comment error:', err);
      throw err instanceof ApiClientError ? err : new Error('Gagal menambahkan komentar');
    }
  };

  return (
    <div className="dashboard-page pb-20 md:pb-6">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-navy hover:text-blue mb-4 transition-colors"
      >
        <ArrowLeft size={20} />
        <span className="font-medium">Kembali</span>
      </button>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto">
        {/* Title Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl" aria-hidden="true">
                {report.categoryEmoji}
              </span>
              <h1 className="text-xl md:text-2xl font-bold font-display text-navy">
                {report.title}
              </h1>
            </div>
            <div
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5",
                "text-sm font-medium border flex-shrink-0",
                statusConfig.bg,
                statusConfig.border
              )}
              style={{ color: statusConfig.textColor }}
            >
              <span aria-hidden="true">{statusConfig.emoji}</span>
              <span>{statusConfig.label}</span>
            </div>
          </div>
          <p className="text-sm text-muted flex items-center gap-1.5">
            <MapPin size={16} className="flex-shrink-0" />
            {report.locationAddress}
          </p>
        </div>

        {/* Image Gallery */}
        <div className="card-base p-0 mb-4 overflow-hidden">
          {/* Main Image */}
          <div className="relative aspect-video bg-gray-100">
            {reportImages.length > 0 ? (
              <Image
                src={reportImages[selectedImageIndex]}
                alt={`Foto laporan ${report.title}`}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <ImageIcon size={48} className="text-muted opacity-30" />
              </div>
            )}
            {/* Image Counter */}
            {reportImages.length > 1 && (
              <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-sm font-medium">
                {selectedImageIndex + 1} / {reportImages.length}
              </div>
            )}
          </div>

          {/* Thumbnail Strip */}
          {reportImages.length > 1 && (
            <div className="flex gap-2 p-4 overflow-x-auto">
              {reportImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={cn(
                    "relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all",
                    selectedImageIndex === idx
                      ? "border-blue ring-2 ring-blue/20"
                      : "border-transparent hover:border-gray-300"
                  )}
                >
                  <Image
                    src={img}
                    alt={`Thumbnail ${idx + 1}`}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* AI Summary Card */}
        {report.aiSummary && (
          <div className="card-base p-5 mb-4 bg-gradient-to-br from-blue/5 to-purple/5 border-blue/20">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-blue/10 rounded-lg">
                <Sparkles size={20} className="text-blue" />
              </div>
              <div>
                <h2 className="text-base font-bold font-display text-navy">
                  Ringkasan AI
                </h2>
                <p className="text-xs text-muted">
                  Analisis otomatis dari laporan ini
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex-1 text-sm text-ink leading-relaxed whitespace-pre-wrap">
                {report.aiSummary}
              </div>
            </div>
          </div>
        )}

        {/* AI Analysis Card (if available) */}
        {report.aiAnalysis && (
          <div className="card-base p-5 mb-4 bg-gradient-to-br from-purple/5 to-pink/5 border-purple/20">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-purple/10 rounded-lg">
                <Sparkles size={20} className="text-purple" />
              </div>
              <div>
                <h2 className="text-base font-bold font-display text-navy">
                  Analisis Detail AI
                </h2>
                <p className="text-xs text-muted">
                  Analisis mendalam dari sistem AI
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {/* Danger Level */}
              {report.dangerLevel != null && (
                <div className="flex items-start gap-3">
                  <div className="w-24 flex-shrink-0 text-sm font-medium text-muted">
                    Tingkat Bahaya
                  </div>
                  <div className="flex-1">
                    <span
                      className={cn(
                        "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold",
                        report.dangerLevel >= 70
                          ? "bg-red/10 text-red border border-red/20"
                          : report.dangerLevel >= 40
                          ? "bg-yellow/10 text-yellow border border-yellow/20"
                          : "bg-green/10 text-green border border-green/20"
                      )}
                    >
                      {report.dangerLevel >= 70 ? "Tinggi" : report.dangerLevel >= 40 ? "Sedang" : "Rendah"} ({report.dangerLevel}/100)
                    </span>
                  </div>
                </div>
              )}

              {/* Priority */}
              {report.priority && (
                <div className="flex items-start gap-3">
                  <div className="w-24 flex-shrink-0 text-sm font-medium text-muted">
                    Prioritas
                  </div>
                  <div className="flex-1 text-sm font-semibold text-navy">
                    {report.priority}
                  </div>
                </div>
              )}

              {/* Priority Score */}
              {report.priorityScore && (
                <div className="flex items-start gap-3">
                  <div className="w-24 flex-shrink-0 text-sm font-medium text-muted">
                    Skor Prioritas
                  </div>
                  <div className="flex-1 text-sm font-semibold text-navy">
                    {report.priorityScore}
                  </div>
                </div>
              )}

              {/* AI Analysis Text */}
              {typeof report.aiAnalysis === 'string' && (
                <div className="flex items-start gap-3 pt-2 border-t border-purple/10">
                  <div className="w-24 flex-shrink-0 text-sm font-medium text-muted">
                    Analisis
                  </div>
                  <div className="flex-1 text-sm text-ink leading-relaxed whitespace-pre-wrap">
                    {report.aiAnalysis}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Report Details Card */}
        <div className="card-base p-5 mb-4">
          {/* Category Label */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg font-bold font-display text-navy">
              {report.categoryName}
            </span>
          </div>

          {/* Description Section */}
          {report.description && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-white rounded-lg border border-gray-200">
                  <User size={18} className="text-blue" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-navy mb-2">
                    Deskripsi dari Pelapor
                  </p>
                  <p className="text-sm text-ink leading-relaxed">
                    {report.description}
                  </p>
                </div>
              </div>
            </div>
          )}

          {!report.description && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-dashed border-gray-300">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-white rounded-lg border border-gray-200">
                  <User size={18} className="text-muted" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-muted mb-2">
                    Deskripsi dari Pelapor
                  </p>
                  <p className="text-sm text-muted italic">
                    Pelapor tidak memberikan deskripsi tambahan untuk laporan ini.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Metadata Grid */}
          <div className="space-y-3 mb-6">
            {/* PIC */}
            {report.picName && (
              <div className="flex items-start gap-3">
                <User
                  size={20}
                  className="text-muted mt-0.5 flex-shrink-0"
                />
                <div className="flex-1">
                  <div className="text-xs font-medium text-muted mb-1">
                    Penanggung Jawab
                  </div>
                  <div className="text-sm font-body text-navy">
                    {report.picName}
                  </div>
                </div>
              </div>
            )}

            {/* Estimated End */}
            {report.estimatedEnd && (
              <div className="flex items-start gap-3">
                <Calendar
                  size={20}
                  className="text-muted mt-0.5 flex-shrink-0"
                />
                <div className="flex-1">
                  <div className="text-xs font-medium text-muted mb-1">
                    Estimasi Selesai
                  </div>
                  <div className="text-sm font-body text-navy">
                    {new Date(report.estimatedEnd).toLocaleDateString(
                      "id-ID",
                      {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      }
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="border-t border-border my-5" />

          {/* Action Buttons */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              {/* Upvote */}
              <button
                onClick={handleUpvote}
                disabled={isUpvoting}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all font-medium",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  report.hasVoted
                    ? "bg-blue text-white shadow-md shadow-blue/20"
                    : "bg-gray-100 text-muted hover:bg-gray-200"
                )}
              >
                <ArrowBigUp
                  size={20}
                  className={report.hasVoted ? "fill-current" : ""}
                />
                <span>{report.upvoteCount}</span>
              </button>

              {/* Comments */}
              <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-100 text-muted hover:bg-gray-200 transition-all font-medium">
                <MessageCircle size={20} />
                <span>{report.commentCount}</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              {/* Bookmark */}
              <button
                onClick={handleBookmark}
                disabled={isBookmarking}
                className={cn(
                  "p-2.5 rounded-xl transition-all",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  report.hasBookmarked
                    ? "bg-yellow/10 text-yellow"
                    : "bg-gray-100 text-muted hover:bg-gray-200"
                )}
                aria-label="Bookmark"
              >
                <Bookmark
                  size={20}
                  className={report.hasBookmarked ? "fill-current" : ""}
                />
              </button>

              {/* Share */}
              <button
                onClick={handleShare}
                className="p-2.5 rounded-xl bg-gray-100 text-muted hover:bg-gray-200 transition-all"
                aria-label="Share"
              >
                <Share2 size={20} />
              </button>
            </div>
          </div>

          {/* Timestamp */}
          <div className="mt-5 pt-5 border-t border-border">
            <span className="text-xs font-body text-muted">
              Dilaporkan {formatRelativeTime(report.createdAt)}
            </span>
          </div>
        </div>

        {/* Comments Section */}
        <div className="card-base p-5">
          <h2 className="text-lg font-bold font-display text-navy mb-4">
            Komentar ({report.commentCount})
          </h2>
          <CommentThread
            comments={comments}
            onAddComment={handleAddComment}
            canComment={!!user}
            currentUserName={user?.name || "Anda"}
            placeholder="Tulis komentar Anda..."
          />
        </div>
      </div>
    </div>
  );
}
