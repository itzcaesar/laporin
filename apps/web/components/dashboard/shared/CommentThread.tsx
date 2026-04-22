// ── components/dashboard/shared/CommentThread.tsx ──
"use client";

import { useState } from "react";
import { formatRelativeTime, cn } from "@/lib/utils";
import { Send, MessageCircle } from "lucide-react";

export type Comment = {
  id: string;
  content: string;
  authorName: string | null;
  authorAvatar?: string;
  isGovernment: boolean;
  isOfficial?: boolean;
  createdAt: string;
  replies: Comment[];
};

type CommentThreadProps = {
  comments: Comment[];
  onAddComment?: (content: string) => Promise<void>;
  canComment?: boolean;
  currentUserName?: string;
  placeholder?: string;
};

export function CommentThread({
  comments,
  onAddComment,
  canComment = true,
  currentUserName = "Anda",
  placeholder = "Tulis komentar...",
}: CommentThreadProps) {
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting || !onAddComment) return;

    setIsSubmitting(true);
    try {
      await onAddComment(newComment);
      setNewComment("");
    } catch (error) {
      console.error("Failed to add comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderComment = (comment: Comment, isReply = false) => (
    <div
      key={comment.id}
      className={cn(
        "rounded-xl p-4",
        comment.isGovernment || comment.isOfficial
          ? "bg-navy/5 border-l-4 border-navy"
          : "bg-white border border-border",
        isReply && "ml-8 mt-3"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
            comment.isGovernment || comment.isOfficial
              ? "bg-navy text-white"
              : "bg-blue-light text-blue"
          )}
        >
          {comment.authorAvatar ||
            comment.authorName?.charAt(0).toUpperCase() ||
            "A"}
        </div>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-ink">
              {comment.authorName || "Anonim"}
            </span>
            {(comment.isGovernment || comment.isOfficial) && (
              <span className="rounded-full bg-navy px-2 py-0.5 text-xs font-semibold text-white">
                Resmi Dinas
              </span>
            )}
            <span className="text-xs text-muted">
              {formatRelativeTime(comment.createdAt)}
            </span>
          </div>

          {/* Content */}
          <p className="text-sm text-ink leading-relaxed whitespace-pre-wrap">
            {comment.content}
          </p>
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
    <div className="space-y-4">
      {/* Comment Form */}
      {canComment && onAddComment && (
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="flex gap-3">
            {/* Avatar */}
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-light text-blue text-sm font-semibold">
              {currentUserName.charAt(0).toUpperCase()}
            </div>

            {/* Input */}
            <div className="flex-1">
              <div className="relative">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder={placeholder}
                  rows={3}
                  className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-ink placeholder:text-muted focus:border-blue focus:outline-none focus:ring-2 focus:ring-blue/20 resize-none"
                />
              </div>
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-muted">
                  {newComment.length}/500 karakter
                </p>
                <button
                  type="submit"
                  disabled={!newComment.trim() || isSubmitting || newComment.length > 500}
                  className="flex items-center gap-2 rounded-lg bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={14} />
                  {isSubmitting ? "Mengirim..." : "Kirim"}
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Comments List */}
      {comments.length === 0 ? (
        <div className="rounded-xl bg-surface p-12 text-center border border-border">
          <MessageCircle size={48} className="mx-auto text-muted mb-3 opacity-30" />
          <p className="text-sm font-medium text-ink mb-1">
            Belum ada komentar
          </p>
          <p className="text-xs text-muted">
            {canComment
              ? "Jadilah yang pertama berkomentar"
              : "Komentar akan muncul di sini"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => renderComment(comment))}
        </div>
      )}
    </div>
  );
}
