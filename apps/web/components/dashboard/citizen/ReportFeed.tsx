// ── components/dashboard/citizen/ReportFeed.tsx ──
"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { cn, formatRelativeTime } from "@/lib/utils";
import { getStatusConfig } from "@/lib/status-config";
import {
  ArrowBigUp,
  MessageCircle,
  Bookmark,
  Share2,
  MoreVertical,
  MapPin,
} from "lucide-react";
import type { Report } from '@laporin/types';
import { api } from "@/lib/api-client";
import { CommentModal } from "./CommentModal";

interface ReportFeedProps {
  reports: Report[];
  className?: string;
}

export function ReportFeed({ reports, className }: ReportFeedProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {reports.map((report) => (
        <ReportFeedItem key={report.id} report={report} />
      ))}
    </div>
  );
}

// Comment preview component for feed
function CommentPreview({
  author,
  text,
  onClick,
}: {
  author: string;
  text: string;
  onClick: (e: React.MouseEvent) => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left group"
    >
      <p className="text-sm text-ink leading-relaxed">
        <span className="font-semibold">{author}</span>{" "}
        <span className="text-muted group-hover:text-ink transition-colors">
          {text}
        </span>
      </p>
    </button>
  );
}

function ReportFeedItem({ report }: { report: Report }) {
  const [isUpvoted, setIsUpvoted] = useState(report.hasVoted);
  const [upvoteCount, setUpvoteCount] = useState(report.upvoteCount);
  const [isBookmarked, setIsBookmarked] = useState(report.hasBookmarked);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const [isBookmarkLoading, setIsBookmarkLoading] = useState(false);
  const statusConfig = getStatusConfig(report.status);

  // Use actual report thumbnail or a fallback placeholder
  const reportImage = report.thumbnailUrl || null;

  const handleUpvote = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isVoting) return;

    setIsVoting(true);
    try {
      if (isUpvoted) {
        await api.delete(`/reports/${report.id}/vote`);
        setIsUpvoted(false);
        setUpvoteCount((prev) => Math.max(0, prev - 1));
      } else {
        await api.post(`/reports/${report.id}/vote`, {});
        setIsUpvoted(true);
        setUpvoteCount((prev) => prev + 1);
      }
    } catch (err) {
      console.error("Vote error:", err);
    } finally {
      setIsVoting(false);
    }
  };

  const handleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isBookmarkLoading) return;

    setIsBookmarkLoading(true);
    try {
      if (isBookmarked) {
        await api.delete(`/user/bookmarks/${report.id}`);
        setIsBookmarked(false);
      } else {
        await api.post(`/user/bookmarks/${report.id}`, {});
        setIsBookmarked(true);
      }
    } catch (err) {
      console.error("Bookmark error:", err);
    } finally {
      setIsBookmarkLoading(false);
    }
  };

  const handleComment = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsCommentModalOpen(true);
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (navigator.share) {
      try {
        await navigator.share({
          title: report.title,
          text: report.categoryName,
          url: `/citizen/reports/${report.id}`,
        });
      } catch (err) {
        console.log("Share cancelled");
      }
    }
  };

  return (
    <>
      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 pb-3">
          <Link
            href={`/citizen/reports/${report.id}`}
            className="flex items-center gap-3 flex-1 min-w-0"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-navy text-white font-semibold text-sm">
              {report.categoryEmoji}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-navy truncate">
                {report.categoryName}
              </h3>
              <p className="text-xs text-muted">
                {formatRelativeTime(report.createdAt)}
              </p>
            </div>
          </Link>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            className="p-2 hover:bg-surface rounded-full transition-colors"
          >
            <MoreVertical size={18} className="text-muted" />
          </button>
        </div>

        {/* Image */}
        <Link href={`/citizen/reports/${report.id}`}>
          <div className="relative aspect-square bg-gray-100">
            {reportImage ? (
              <Image
                src={reportImage}
                alt={report.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 600px"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                <span className="text-6xl mb-2">{report.categoryEmoji}</span>
                <span className="text-xs text-muted font-medium">Foto Laporan</span>
              </div>
            )}
            {/* Status Badge Overlay */}
            <div className="absolute top-3 right-3">
              <div
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5",
                  "text-xs font-medium border backdrop-blur-sm",
                  statusConfig.bg,
                  statusConfig.border
                )}
                style={{ color: statusConfig.textColor }}
              >
                <span aria-hidden="true">{statusConfig.emoji}</span>
                <span>{statusConfig.label}</span>
              </div>
            </div>

            {/* Reporter info overlay - Bottom */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent p-4 pt-16">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm text-white font-semibold text-xs border-2 border-white/50">
                  {report.reporterName?.charAt(0)?.toUpperCase() || "W"}
                </div>
                <div>
                  <p className="text-xs text-white/80">Dilaporkan oleh</p>
                  <p className="text-sm font-semibold text-white">
                    {report.reporterName || "Warga"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Link>

        {/* Actions */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
          <div className="flex items-center gap-4">
            <button
              onClick={handleUpvote}
              disabled={isVoting}
              className={cn(
                "flex items-center gap-1.5 transition-colors disabled:opacity-50",
                isUpvoted ? "text-blue" : "text-muted"
              )}
            >
              <ArrowBigUp
                size={24}
                className={isUpvoted ? "fill-current" : ""}
              />
              <span className="text-sm font-medium">{upvoteCount}</span>
            </button>
            <button
              onClick={handleComment}
              className="flex items-center gap-1.5 text-muted transition-colors hover:text-ink"
            >
              <MessageCircle size={24} />
              <span className="text-sm font-medium">{report.commentCount}</span>
            </button>
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 text-muted transition-colors hover:text-ink"
            >
              <Share2 size={22} />
            </button>
          </div>
          <button
            onClick={handleBookmark}
            disabled={isBookmarkLoading}
            className={cn(
              "transition-colors disabled:opacity-50",
              isBookmarked ? "text-yellow-600" : "text-muted hover:text-ink"
            )}
          >
            <Bookmark size={24} className={isBookmarked ? "fill-current" : ""} />
          </button>
        </div>

        {/* Content */}
        <div className="px-4 pt-3 pb-4">
          {/* Title */}
          <h2 className="text-base font-bold text-navy mb-1.5">{report.title}</h2>
          
          {/* Description from reporter - IG style (without username) */}
          {report.description && (
            <p className="text-sm text-ink leading-relaxed mb-3">
              {report.description}
            </p>
          )}

          {/* Comment previews - Show top 2-3 comments */}
          {report.commentCount > 0 && (
            <>
              <div className="space-y-1.5 pb-2 border-b border-border/30">
                {report.topComments && report.topComments.length > 0 ? (
                  report.topComments.map((comment) => (
                    <CommentPreview
                      key={comment.id}
                      author={comment.authorName}
                      text={comment.content}
                      onClick={handleComment}
                    />
                  ))
                ) : (
                  <p className="text-xs text-muted">Belum ada komentar</p>
                )}
              </div>

              {/* View all comments button */}
              {report.commentCount > 2 && (
                <button
                  onClick={handleComment}
                  className="text-sm text-muted hover:text-ink transition-colors block mt-2 mb-3"
                >
                  Lihat semua {report.commentCount} komentar
                </button>
              )}
            </>
          )}

          {/* Location */}
          <div className={cn(
            "flex items-start gap-1.5 text-xs text-muted",
            report.commentCount > 0 && "mt-3"
          )}>
            <MapPin size={14} className="mt-0.5 shrink-0" />
            <p className="line-clamp-1">{report.locationAddress}</p>
          </div>
          
          {/* PIC Info */}
          {report.picName && (
            <p className="text-xs text-muted mt-1">
              PIC: {report.picName}
              {report.estimatedEnd && (
                <>
                  {" • "}
                  Est. selesai{" "}
                  {new Date(report.estimatedEnd).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                  })}
                </>
              )}
            </p>
          )}
        </div>
      </div>

      {/* Comment Modal */}
      <CommentModal
        isOpen={isCommentModalOpen}
        onClose={() => setIsCommentModalOpen(false)}
        reportId={report.id}
        reportTitle={report.title}
        commentCount={report.commentCount}
      />
    </>
  );
}
