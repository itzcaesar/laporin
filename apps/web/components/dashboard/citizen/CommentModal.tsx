// ── components/dashboard/citizen/CommentModal.tsx ──
"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { cn, formatRelativeTime } from "@/lib/utils";
import type { Comment } from "@/components/dashboard/shared/CommentThread";

type CommentModalProps = {
  isOpen: boolean;
  onClose: () => void;
  reportId: string;
  reportTitle: string;
  commentCount: number;
};

import { useReport } from "@/hooks/useReport";
import { api } from "@/lib/api-client";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

export function CommentModal({
  isOpen,
  onClose,
  reportId,
  reportTitle,
  commentCount,
}: CommentModalProps) {
  const { report, isLoading, refetch } = useReport(reportId);
  const { user } = useAuth();
  const comments = report?.comments || [];
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);

    try {
      await api.post(`/reports/${reportId}/comments`, { content: newComment });
      setNewComment("");
      refetch();
    } catch (err) {
      console.error("Failed to post comment", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const renderComment = (comment: Comment, isReply = false) => (
    <div
      key={comment.id}
      className={cn(
        isReply && "ml-10 mt-2"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
            comment.isGovernment || comment.isOfficial
              ? "bg-navy text-white"
              : "bg-gradient-to-br from-blue-400 to-blue-600 text-white"
          )}
        >
          {comment.authorName?.charAt(0).toUpperCase() || "A"}
        </div>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex flex-wrap items-center gap-2 mb-0.5">
            <span className="text-sm font-semibold text-ink">
              {comment.authorName || "Anonim"}
            </span>
            {(comment.isGovernment || comment.isOfficial) && (
              <span className="rounded-full bg-navy px-2 py-0.5 text-[10px] font-semibold text-white">
                Resmi Dinas
              </span>
            )}
          </div>

          {/* Content */}
          <p className="text-sm text-ink leading-relaxed whitespace-pre-wrap mb-1">
            {comment.content}
          </p>

          {/* Actions */}
          <div className="flex items-center gap-4 mt-1">
            <span className="text-xs text-muted">
              {formatRelativeTime(comment.createdAt)}
            </span>
            <button className="text-xs font-semibold text-muted hover:text-ink transition-colors">
              Suka
            </button>
            <button className="text-xs font-semibold text-muted hover:text-ink transition-colors">
              Balas
            </button>
          </div>
        </div>
      </div>

      {/* Render Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-3 space-y-3">
          {comment.replies.map((reply) => renderComment(reply, true))}
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal - Bottom sheet (85vh) */}
      <div className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl max-h-[85vh] flex flex-col animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
          <h2 className="text-base font-bold font-display text-navy">
            Komentar
          </h2>
          <button
            onClick={onClose}
            className="flex items-center justify-center h-8 w-8 rounded-full hover:bg-surface transition-colors"
          >
            <X size={20} className="text-muted" />
          </button>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-navy" size={24} />
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-muted">Belum ada komentar</p>
              <p className="text-xs text-muted mt-1">
                Jadilah yang pertama berkomentar
              </p>
            </div>
          ) : (
            <div className="space-y-4 divide-y divide-border">
              {comments.map((comment) => (
                <div key={comment.id} className="pt-4 first:pt-0">
                  {renderComment(comment)}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Input */}
        <form
          onSubmit={handleSubmit}
          className="border-t border-border p-4 bg-white shrink-0"
        >
          <div className="flex gap-3 items-center">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy text-white text-xs font-semibold">
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </div>
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Tambahkan komentar..."
              className="flex-1 bg-transparent text-sm text-ink placeholder:text-muted focus:outline-none"
              disabled={isSubmitting}
            />
            {newComment.trim() && (
              <button
                type="submit"
                disabled={isSubmitting}
                className="text-sm font-semibold text-blue hover:text-blue/80 transition-colors disabled:opacity-50"
              >
                Kirim
              </button>
            )}
          </div>
        </form>
      </div>
    </>
  );
}
