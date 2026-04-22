// ── components/dashboard/gov/GovCommentThread.tsx ──
"use client";

import { useState } from "react";
import { formatRelativeTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

type Comment = {
  id: string;
  content: string;
  authorName: string | null;
  isGovernment: boolean;
  createdAt: string;
  replies: Comment[];
};

type GovCommentThreadProps = {
  comments: Comment[];
  onReply: (commentId: string, content: string) => Promise<void>;
};

export function GovCommentThread({
  comments,
  onReply,
}: GovCommentThreadProps) {
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReply = async (commentId: string) => {
    if (!replyContent.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onReply(commentId, replyContent);
      setReplyContent("");
      setReplyingTo(null);
    } catch (error) {
      console.error("Failed to reply:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderComment = (comment: Comment, isReply = false) => (
    <div
      key={comment.id}
      className={cn(
        "rounded-xl p-4",
        comment.isGovernment
          ? "bg-navy/5 border-l-2 border-navy"
          : "bg-white border border-border",
        isReply && "ml-8 mt-3"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
            comment.isGovernment
              ? "bg-navy text-white"
              : "bg-blue-light text-blue"
          )}
        >
          {comment.authorName?.charAt(0).toUpperCase() || "A"}
        </div>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-ink">
              {comment.authorName || "Anonim"}
            </span>
            {comment.isGovernment && (
              <span className="rounded-full bg-navy px-2 py-0.5 text-xs font-semibold text-white">
                Resmi Dinas
              </span>
            )}
            <span className="text-xs text-muted">
              {formatRelativeTime(comment.createdAt)}
            </span>
          </div>

          {/* Content */}
          <p className="text-sm text-ink leading-relaxed mb-3">
            {comment.content}
          </p>

          {/* Reply Button (only for citizen comments) */}
          {!comment.isGovernment && !isReply && (
            <button
              type="button"
              onClick={() => setReplyingTo(comment.id)}
              className="text-sm font-medium text-blue hover:text-blue/80 transition-colors"
            >
              Balas
            </button>
          )}

          {/* Reply Form */}
          {replyingTo === comment.id && (
            <div className="mt-3 space-y-2">
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Tulis balasan resmi..."
                rows={3}
                className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-blue focus:outline-none focus:ring-2 focus:ring-blue/20 resize-none"
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleReply(comment.id)}
                  disabled={!replyContent.trim() || isSubmitting}
                  className="rounded-lg bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Mengirim..." : "Kirim Balasan Resmi"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setReplyingTo(null);
                    setReplyContent("");
                  }}
                  className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-ink hover:bg-surface transition-colors"
                >
                  Batalkan
                </button>
              </div>
            </div>
          )}
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
      {comments.length === 0 ? (
        <div className="rounded-xl bg-surface p-8 text-center">
          <p className="text-sm text-muted">Belum ada komentar</p>
        </div>
      ) : (
        comments.map((comment) => renderComment(comment))
      )}
    </div>
  );
}
