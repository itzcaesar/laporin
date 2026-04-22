// ── app/citizen/reports/[id]/page.tsx ──
// Individual report detail page

"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { MOCK_REPORTS } from "@/data/mock-reports";
import { mockToReportDetail } from "@/lib/mock-adapter";
import { getStatusConfig } from "@/lib/status-config";
import { cn, formatRelativeTime } from "@/lib/utils";
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
import type { ReportDetail } from "@/types";
import { CommentThread, type Comment } from "@/components/dashboard/shared/CommentThread";
import { useAuth } from "@/hooks/useAuth";

export default function ReportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const reportId = params.id as string;
  const { user } = useAuth();

  const [report, setReport] = useState<ReportDetail | null>(null);
  const [isUpvoted, setIsUpvoted] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [comments, setComments] = useState<Comment[]>([
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
          isOfficial: true,
          createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          replies: [],
        },
      ],
    },
    {
      id: "3",
      content: "Saya juga mengalami hal yang sama di area ini. Terima kasih sudah melaporkan!",
      authorName: "Siti Nurhaliza",
      isGovernment: false,
      createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      replies: [],
    },
  ]);

  // Placeholder images - in production, these would come from the report data
  const reportImages = [
    "https://images.unsplash.com/photo-1581094271901-8022df4466f9?w=800&q=80",
    "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=800&q=80",
    "https://images.unsplash.com/photo-1581094271901-8022df4466f9?w=800&q=80",
  ];

  // Placeholder AI summary
  const aiSummary = {
    severity: "Tinggi",
    estimatedCost: "Rp 15.000.000 - Rp 25.000.000",
    urgency: "Segera",
    recommendation:
      "Perbaikan jalan berlubang ini memerlukan penanganan segera untuk mencegah kerusakan lebih lanjut dan menghindari risiko kecelakaan. Disarankan untuk melakukan penambalan aspal dan perbaikan drainase di sekitar area.",
  };

  useEffect(() => {
    // Find the report from mock data
    const mockReport = MOCK_REPORTS.find((r) => r.id === reportId);
    if (mockReport) {
      setReport(mockToReportDetail(mockReport));
    }
  }, [reportId]);

  if (!report) {
    return (
      <div className="dashboard-page">
        <div className="text-center py-12">
          <p className="text-muted">Laporan tidak ditemukan</p>
          <button
            onClick={() => router.back()}
            className="mt-4 text-blue hover:underline"
          >
            Kembali
          </button>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(report.status);

  const handleUpvote = () => {
    setIsUpvoted(!isUpvoted);
  };

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
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
    // TODO: API call to POST /api/v1/reports/{reportId}/comments
    console.log("Adding comment:", content);
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Add new comment to state
    const newComment: Comment = {
      id: `temp-${Date.now()}`,
      content,
      authorName: user?.name || "Anda",
      isGovernment: false,
      createdAt: new Date().toISOString(),
      replies: [],
    };

    setComments((prev) => [...prev, newComment]);
    
    // Update comment count
    if (report) {
      setReport({
        ...report,
        commentCount: report.commentCount + 1,
      });
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
            {/* Severity */}
            <div className="flex items-start gap-3">
              <div className="w-24 flex-shrink-0 text-sm font-medium text-muted">
                Tingkat Bahaya
              </div>
              <div className="flex-1">
                <span
                  className={cn(
                    "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold",
                    aiSummary.severity === "Tinggi"
                      ? "bg-red/10 text-red border border-red/20"
                      : "bg-yellow/10 text-yellow border border-yellow/20"
                  )}
                >
                  {aiSummary.severity}
                </span>
              </div>
            </div>

            {/* Estimated Cost */}
            <div className="flex items-start gap-3">
              <div className="w-24 flex-shrink-0 text-sm font-medium text-muted">
                Est. Biaya
              </div>
              <div className="flex-1 text-sm font-semibold text-navy">
                {aiSummary.estimatedCost}
              </div>
            </div>

            {/* Urgency */}
            <div className="flex items-start gap-3">
              <div className="w-24 flex-shrink-0 text-sm font-medium text-muted">
                Urgensi
              </div>
              <div className="flex-1 text-sm font-semibold text-navy">
                {aiSummary.urgency}
              </div>
            </div>

            {/* Recommendation */}
            <div className="flex items-start gap-3 pt-2 border-t border-blue/10">
              <div className="w-24 flex-shrink-0 text-sm font-medium text-muted">
                Rekomendasi
              </div>
              <div className="flex-1 text-sm text-ink leading-relaxed">
                {aiSummary.recommendation}
              </div>
            </div>
          </div>
        </div>

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
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all font-medium",
                  isUpvoted
                    ? "bg-blue text-white shadow-md shadow-blue/20"
                    : "bg-gray-100 text-muted hover:bg-gray-200"
                )}
              >
                <ArrowBigUp
                  size={20}
                  className={isUpvoted ? "fill-current" : ""}
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
                className={cn(
                  "p-2.5 rounded-xl transition-all",
                  isBookmarked
                    ? "bg-yellow/10 text-yellow"
                    : "bg-gray-100 text-muted hover:bg-gray-200"
                )}
                aria-label="Bookmark"
              >
                <Bookmark
                  size={20}
                  className={isBookmarked ? "fill-current" : ""}
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
            Komentar ({comments.length})
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
