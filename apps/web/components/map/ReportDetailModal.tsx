// ── components/map/ReportDetailModal.tsx ──
"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { getStatusConfig } from "@/lib/status-config";
import { useReport } from "@/hooks/useReport";
import { api } from "@/lib/api-client";
import type { ReportDetail, Comment } from "@/types";
import {
  X,
  ArrowBigUp,
  ArrowBigDown,
  MessageCircle,
  MapPin,
  Clock,
  User,
  Building2,
  Shield,
  Send,
  ChevronUp,
  ChevronDown,
  AlertTriangle,
  Loader2,
} from "lucide-react";

// ── Priority display mapping ──
const PRIORITY_LABELS: Record<string, string> = {
  low: "Rendah",
  medium: "Sedang",
  high: "Tinggi",
  urgent: "Kritis",
};

const PRIORITY_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  low: { bg: "bg-gray-50", text: "text-gray-600", border: "border-gray-200" },
  medium: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  high: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
  urgent: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
};

interface ReportDetailModalProps {
  reportId: string;
  onClose: () => void;
}

export function ReportDetailModal({ reportId, onClose }: ReportDetailModalProps) {
  const { report, isLoading, error, refetch } = useReport(reportId);
  const [commentText, setCommentText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  const handleUpvote = async () => {
    if (!report) return;
    try {
      if (report.hasVoted) {
        await api.delete(`/reports/${reportId}/vote`);
      } else {
        await api.post(`/reports/${reportId}/vote`, {});
      }
      refetch();
    } catch {
      // Silently fail — user may not be logged in
    }
  };

  const handleSubmitComment = async () => {
    if (!commentText.trim() || !report) return;
    setIsSubmittingComment(true);
    try {
      await api.post(`/reports/${reportId}/comments`, {
        content: commentText.trim(),
      });
      setCommentText("");
      refetch();
    } catch {
      // Silently fail — user may not be logged in
    } finally {
      setIsSubmittingComment(false);
    }
  };

  if (!mounted) return null;

  const modalContent = (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 sm:p-6">
        <div
          className="relative flex w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl max-h-[90vh] sm:max-h-[85vh] mx-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ═══ Header ═══ */}
          <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-4 py-3">
            <div className="flex items-center gap-2">
              {report ? (
                <>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-navy text-sm text-white">
                    {report.reporterName?.charAt(0) ?? report.isAnonymous ? "🔒" : "?"}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-navy">
                      {report.isAnonymous ? "Anonim" : report.reporterName ?? "Warga"}
                    </span>
                    <span className="text-[10px] text-muted">
                      {new Date(report.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })} • {report.locationAddress.split(",")[0]}
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 animate-pulse rounded-full bg-gray-200" />
                  <div className="space-y-1">
                    <div className="h-3 w-24 animate-pulse rounded bg-gray-200" />
                    <div className="h-2 w-36 animate-pulse rounded bg-gray-200" />
                  </div>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-gray-100 hover:text-navy"
            >
              <X size={18} />
            </button>
          </div>

          {/* ═══ Scrollable Content ═══ */}
          <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {isLoading ? (
              <div className="flex h-64 items-center justify-center">
                <div className="text-center">
                  <Loader2 size={32} className="mx-auto animate-spin text-navy" />
                  <p className="mt-3 text-sm text-muted">Memuat detail laporan...</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex h-64 items-center justify-center">
                <div className="text-center">
                  <p className="text-2xl">⚠️</p>
                  <p className="mt-2 font-display text-sm font-semibold text-navy">
                    Gagal memuat laporan
                  </p>
                  <p className="mt-1 text-xs text-muted">{error}</p>
                  <button
                    type="button"
                    onClick={refetch}
                    className="mt-3 rounded-lg bg-navy px-4 py-1.5 text-xs font-semibold text-white"
                  >
                    Coba Lagi
                  </button>
                </div>
              </div>
            ) : report ? (
              <ReportContent
                report={report}
                onUpvote={handleUpvote}
              />
            ) : null}
          </div>

          {/* ═══ Comment Input (fixed at bottom) ═══ */}
          {report && (
            <div className="shrink-0 border-t border-gray-100 bg-white px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-light text-xs font-bold text-blue">
                  K
                </div>
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmitComment()}
                  placeholder="Tulis komentar..."
                  disabled={isSubmittingComment}
                  className="flex-1 rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-ink outline-none transition-colors placeholder:text-muted/50 focus:border-blue focus:bg-white disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={handleSubmitComment}
                  disabled={!commentText.trim() || isSubmittingComment}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200",
                    commentText.trim() && !isSubmittingComment
                      ? "bg-blue text-white hover:bg-blue/90"
                      : "bg-gray-100 text-muted"
                  )}
                >
                  {isSubmittingComment ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Send size={14} />
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );

  return createPortal(modalContent, document.body);
}

// ── Report content sub-component ──
function ReportContent({
  report,
  onUpvote,
}: {
  report: ReportDetail;
  onUpvote: () => void;
}) {
  const statusCfg = getStatusConfig(report.status);
  const priorityLabel = PRIORITY_LABELS[report.priority] ?? "Sedang";
  const priorityStyle = PRIORITY_STYLES[report.priority] ?? PRIORITY_STYLES.medium;

  return (
    <>
      {/* ── Photo Area ── */}
      <div className="relative aspect-square w-full bg-gradient-to-br from-slate-100 to-slate-200">
        {report.media && report.media.length > 0 ? (
          <img
            src={report.media[0].fileUrl}
            alt={report.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <span className="text-[6rem] drop-shadow-lg">
              {report.categoryEmoji ?? "📋"}
            </span>
            <span className="rounded-full bg-black/10 px-3 py-1 text-xs font-medium text-slate-600 backdrop-blur-sm">
              Foto Laporan
            </span>
          </div>
        )}

        {/* Status badge overlay */}
        <div className="absolute right-3 top-3">
          <span
            className="rounded-full px-3 py-1 text-xs font-bold shadow-lg"
            style={{
              backgroundColor: statusCfg.color,
              color: statusCfg.textColor,
            }}
          >
            {statusCfg.label}
          </span>
        </div>

        {/* Priority badge overlay */}
        <div className="absolute left-3 top-3">
          <span
            className={cn(
              "flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold shadow-lg",
              priorityStyle.bg,
              priorityStyle.text,
              priorityStyle.border
            )}
          >
            <AlertTriangle size={10} />
            {priorityLabel}
          </span>
        </div>
      </div>

      {/* ── Vote Bar ── */}
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2.5">
        <div className="flex items-center gap-4">
          {/* Upvote */}
          <button
            type="button"
            onClick={onUpvote}
            aria-label="Upvote laporan ini"
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-semibold transition-all duration-200",
              report.hasVoted
                ? "bg-blue-light text-blue"
                : "text-muted hover:bg-gray-50"
            )}
          >
            <ArrowBigUp
              size={18}
              className={cn(report.hasVoted && "fill-blue")}
            />
            {report.upvoteCount}
          </button>

          {/* Comment count */}
          <div className="flex items-center gap-1.5 text-sm text-muted">
            <MessageCircle size={16} />
            {report.commentCount}
          </div>
        </div>

        {/* Score pill */}
        <div
          className={cn(
            "flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold",
            report.upvoteCount > 0
              ? "bg-emerald-50 text-emerald-600"
              : "bg-gray-50 text-muted"
          )}
        >
          {report.upvoteCount > 0 && <ChevronUp size={12} className="stroke-[3]" />}
          Skor: {report.upvoteCount > 0 ? "+" : ""}{report.upvoteCount}
        </div>
      </div>

      {/* ── Title & Description ── */}
      <div className="border-b border-gray-100 px-4 py-4">
        <div className="mb-2 flex items-center gap-2">
          <span className="text-xl">{report.categoryEmoji ?? "📋"}</span>
          <h2 className="font-display text-lg font-bold text-navy">
            {report.title}
          </h2>
        </div>
        <p className="mb-3 text-sm leading-relaxed text-ink">
          {report.description}
        </p>

        {/* Metadata tags */}
        <div className="flex flex-wrap gap-2">
          <span className="flex items-center gap-1 rounded-lg bg-gray-50 px-2.5 py-1 text-[11px] font-medium text-muted">
            <MapPin size={11} />
            {report.locationAddress}
          </span>
          <span className="flex items-center gap-1 rounded-lg bg-gray-50 px-2.5 py-1 text-[11px] font-medium text-muted">
            <Clock size={11} />
            {new Date(report.createdAt).toLocaleDateString("id-ID", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </span>
          {report.categoryName && (
            <span className="flex items-center gap-1 rounded-lg bg-blue-light px-2.5 py-1 text-[11px] font-medium text-blue">
              {report.categoryEmoji} {report.categoryName}
            </span>
          )}
        </div>
      </div>

      {/* ── PIC & Agency Info ── */}
      <div className="border-b border-gray-100 px-4 py-4">
        <p className="mb-3 font-display text-xs font-bold uppercase tracking-wider text-muted">
          Penanggung Jawab
        </p>
        <div className="space-y-3">
          {/* Agency */}
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-navy/10">
              <Building2 size={16} className="text-navy" />
            </div>
            <div>
              <p className="text-xs font-semibold text-navy">Instansi</p>
              <p className="text-xs text-muted">
                {report.agencyName ?? "Belum ditentukan"}
              </p>
            </div>
          </div>

          {/* PIC */}
          {report.picName ? (
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal/10">
                <User size={16} className="text-teal" />
              </div>
              <div>
                <p className="text-xs font-semibold text-navy">PIC</p>
                <p className="text-xs text-muted">{report.picName}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50">
                <Shield size={16} className="text-amber-500" />
              </div>
              <div>
                <p className="text-xs font-semibold text-navy">PIC</p>
                <p className="text-xs text-amber-600">Belum ditugaskan</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Status History ── */}
      {report.statusHistory && report.statusHistory.length > 0 && (
        <div className="border-b border-gray-100 px-4 py-4">
          <p className="mb-3 font-display text-xs font-bold uppercase tracking-wider text-muted">
            Riwayat Status
          </p>
          <div className="space-y-2">
            {report.statusHistory.map((h) => {
              const newCfg = getStatusConfig(h.newStatus);
              return (
                <div key={h.id} className="flex items-start gap-2 text-xs">
                  <span className="mt-0.5">{newCfg.emoji}</span>
                  <div className="flex-1">
                    <span className="font-semibold text-navy">{newCfg.label}</span>
                    <span className="text-muted"> — {h.note}</span>
                    {h.changedByName && (
                      <span className="text-muted"> oleh {h.changedByName}</span>
                    )}
                    <div className="mt-0.5 text-[10px] text-muted">
                      {new Date(h.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Comments Section ── */}
      <div className="px-4 py-4">
        <p className="mb-3 font-display text-xs font-bold uppercase tracking-wider text-muted">
          Komentar ({report.comments?.length ?? 0})
        </p>
        {report.comments && report.comments.length > 0 ? (
          <div className="space-y-3">
            {report.comments.map((comment) => (
              <CommentItem key={comment.id} comment={comment} />
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted">Belum ada komentar.</p>
        )}
      </div>
    </>
  );
}

// ── Comment item sub-component ──
function CommentItem({ comment }: { comment: Comment }) {
  return (
    <div className="flex gap-3">
      <div
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
          comment.isGovernment
            ? "bg-navy text-white"
            : "bg-gray-100 text-muted"
        )}
      >
        {comment.isGovernment ? "🏛" : (comment.authorName?.charAt(0) ?? "?")}
      </div>
      <div className="flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-xs font-semibold text-navy">
            {comment.isGovernment ? "Pemerintah" : comment.authorName ?? "Warga"}
          </span>
          <span className="text-[10px] text-muted">
            {new Date(comment.createdAt).toLocaleDateString("id-ID", {
              day: "numeric",
              month: "short",
            })}
          </span>
        </div>
        <p className="mt-0.5 text-xs leading-relaxed text-ink">
          {comment.content}
        </p>

        {/* Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-2 ml-2 space-y-2 border-l-2 border-gray-100 pl-3">
            {comment.replies.map((reply) => (
              <CommentItem key={reply.id} comment={reply} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
