// ── app/citizen/forum/[id]/page.tsx ──
"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ThumbsUp,
  MessageSquare,
  Share2,
  Flag,
  Pin,
  Lock,
  MoreVertical,
  Send,
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
} from "lucide-react";
import { cn, formatRelativeTime } from "@/lib/utils";
import { useForumThread } from "@/hooks/useForum";
import { api } from "@/lib/api-client";
import LoadingSkeleton from "@/components/dashboard/shared/LoadingSkeleton";
import { useConfetti } from "@/hooks/useConfetti";

// ────────────────────────────────────────────────────────────
// Optimistic vote button – updates count instantly, then syncs
// ────────────────────────────────────────────────────────────
function VoteButton({
  count,
  voted,
  disabled,
  onVote,
}: {
  count: number;
  voted: boolean;
  disabled?: boolean;
  onVote: () => void;
}) {
  const [animate, setAnimate] = useState(false);

  const handleClick = () => {
    if (disabled) return;
    onVote();
    setAnimate(true);
    setTimeout(() => setAnimate(false), 400);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={cn(
        "vote-btn flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all duration-150",
        "border border-border",
        voted
          ? "bg-blue text-white border-blue shadow-sm"
          : "bg-surface hover:bg-white text-ink",
        animate && "voted",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <ThumbsUp
        size={15}
        className={cn(
          "transition-transform duration-150",
          voted && "scale-110"
        )}
      />
      <span className="text-sm font-semibold tabular-nums">{count}</span>
    </button>
  );
}

// ────────────────────────────────────────────────────────────
// Main page
// ────────────────────────────────────────────────────────────
export default function ForumThreadPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { thread: apiThread, isLoading, refetch } = useForumThread(id);
  const { burst } = useConfetti();

  // Optimistic state for thread vote
  const [threadVoted, setThreadVoted] = useState(false);
  const [threadVoteCount, setThreadVoteCount] = useState<number | null>(null);
  const [threadVotePending, setThreadVotePending] = useState(false);


  // Local replies (optimistic add)
  const [localReplies, setLocalReplies] = useState<any[]>([]);
  const [replyContent, setReplyContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  const threadVoteBtnRef = useRef<HTMLDivElement>(null);

  // ── Thread vote (optimistic) ──────────────────────────────
  const handleThreadVote = useCallback(async () => {
    if (!apiThread || threadVotePending) return;

    const baseCount = threadVoteCount ?? apiThread.upvotes;
    const wasVoted = threadVoted;

    // Optimistic update
    setThreadVoted(!wasVoted);
    setThreadVoteCount(wasVoted ? baseCount - 1 : baseCount + 1);

    // Confetti on upvote
    if (!wasVoted && threadVoteBtnRef.current) {
      const rect = threadVoteBtnRef.current.getBoundingClientRect();
      burst(rect.left + rect.width / 2, rect.top + rect.height / 2);
    }

    setThreadVotePending(true);
    try {
      await api.post(`/forum/${id}/vote`, {});
    } catch {
      // Roll back on failure
      setThreadVoted(wasVoted);
      setThreadVoteCount(baseCount);
    } finally {
      setThreadVotePending(false);
    }
  }, [apiThread, threadVotePending, threadVoteCount, threadVoted, id, burst]);

  // ── Reply vote removed: backend has no /forum/replies/:id/vote route ──
  // Reply-level votes are not supported; the VoteButton is hidden on replies.

  // ── Reply submit (optimistic add) ────────────────────────
  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim() || isSubmitting) return;

    const optimisticReply = {
      id: `optimistic-${Date.now()}`,
      content: replyContent,
      author: { name: "Kamu", avatar: "K", reputation: 0 },
      upvotes: 0,
      createdAt: new Date().toISOString(),
      isOptimistic: true,
    };

    // Immediate add to UI
    setLocalReplies((prev) => [...prev, optimisticReply]);
    setReplyContent("");
    setIsSubmitting(true);

    try {
      const res = await api.post<any>(`/forum/${id}/replies`, {
        content: optimisticReply.content,
      });
      // Replace optimistic entry with real one
      setLocalReplies((prev) =>
        prev.map((r) =>
          r.id === optimisticReply.id ? { ...res.data, isOptimistic: false } : r
        )
      );
    } catch {
      // Remove failed optimistic reply
      setLocalReplies((prev) =>
        prev.filter((r) => r.id !== optimisticReply.id)
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Loading ───────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="dashboard-page">
        <div className="max-w-4xl mx-auto space-y-4">
          <LoadingSkeleton variant="forum-thread" />
          <LoadingSkeleton variant="forum-reply" rows={3} />
        </div>
      </div>
    );
  }

  if (!apiThread) {
    return (
      <div className="p-8 text-center text-muted">Thread tidak ditemukan.</div>
    );
  }

  const thread = {
    ...apiThread,
    author: {
      ...apiThread.author,
      avatar: apiThread.author?.name?.substring(0, 2).toUpperCase() || "A",
    },
    repliesList: [
      ...(apiThread.repliesList || []),
      ...localReplies,
    ].map((r) => ({
      ...r,
      author: {
        ...r.author,
        avatar: r.author?.name?.substring(0, 2).toUpperCase() || "U",
      },
    })),
  };

  const displayVoteCount = threadVoteCount ?? thread.upvotes;

  return (
    <div className="dashboard-page">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="btn-interactive flex items-center gap-2 text-sm text-muted hover:text-ink transition-colors mb-4"
        >
          <ArrowLeft size={16} />
          Kembali ke Forum
        </button>

        {/* Thread Header */}
        <div className="rounded-2xl bg-white p-6 border border-border mb-4 shadow-sm">
          <div className="flex items-start gap-2 mb-3">
            {thread.isPinned && (
              <Pin size={18} className="text-blue mt-1 shrink-0" />
            )}
            <h1 className="text-2xl font-bold font-display text-navy flex-1">
              {thread.title}
              {thread.isLocked && (
                <Lock size={18} className="inline ml-2 text-muted" />
              )}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm text-muted mb-4">
            <span className="font-medium text-blue bg-blue-light px-2.5 py-1 rounded-lg">
              {thread.category}
            </span>
            <span>•</span>
            <span>{thread.views} views</span>
            <span>•</span>
            <span>{thread.repliesList.length} replies</span>
            <span>•</span>
            <span>{formatRelativeTime(thread.createdAt)}</span>
          </div>

          {/* Author */}
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-border">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-navy text-white font-semibold">
              {thread.author.avatar}
            </div>
            <div>
              <p className="font-semibold text-ink">{thread.author.name}</p>
              <p className="text-xs text-muted">
                {thread.author.reputation} reputation
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="prose prose-sm max-w-none mb-6">
            <div className="whitespace-pre-wrap text-ink leading-relaxed">
              {thread.content}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-border">
            {/* Vote */}
            <div ref={threadVoteBtnRef}>
              <VoteButton
                count={displayVoteCount}
                voted={threadVoted}
                disabled={threadVotePending}
                onVote={handleThreadVote}
              />
            </div>

            {/* Bookmark */}
            <button
              type="button"
              onClick={() => setIsBookmarked((b) => !b)}
              className={cn(
                "btn-interactive flex items-center gap-2 px-4 py-2 rounded-lg border transition-all",
                isBookmarked
                  ? "border-blue bg-blue-light text-blue"
                  : "border-border bg-surface hover:bg-white"
              )}
            >
              {isBookmarked ? (
                <BookmarkCheck size={16} />
              ) : (
                <Bookmark size={16} />
              )}
              <span className="text-sm font-medium hidden sm:inline">
                {isBookmarked ? "Tersimpan" : "Simpan"}
              </span>
            </button>

            <button className="btn-interactive flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-surface hover:bg-white transition-colors">
              <Share2 size={16} />
              <span className="text-sm font-medium hidden sm:inline">
                Bagikan
              </span>
            </button>

            <button className="btn-interactive ml-auto flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-surface hover:bg-white transition-colors text-muted">
              <Flag size={16} />
              <span className="text-sm font-medium hidden sm:inline">
                Laporkan
              </span>
            </button>
          </div>
        </div>

        {/* Replies */}
        <div className="mb-6">
          <h2 className="text-lg font-bold font-display text-navy mb-4">
            {thread.repliesList.length} Balasan
          </h2>

          <div className="space-y-4">
            {thread.repliesList.map((reply: any) => {
              return (
                <div
                  key={reply.id}
                  className={cn(
                    "rounded-2xl bg-white p-5 border transition-all duration-300",
                    reply.isAccepted
                      ? "border-green-500 bg-green-50/50"
                      : "border-border",
                    reply.isOptimistic && "opacity-70 border-dashed"
                  )}
                >
                  {/* Author */}
                  <div className="flex items-start gap-3 mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-navy text-white font-semibold text-sm">
                      {reply.author.avatar}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-ink">
                          {reply.author.name}
                        </p>
                        {reply.isOptimistic && (
                          <span className="text-xs text-muted animate-pulse">
                            Mengirim...
                          </span>
                        )}
                        {reply.isAccepted && (
                          <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded">
                            <CheckCircle2 size={12} />
                            Jawaban Terbaik
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted">
                        {reply.author.reputation} reputation •{" "}
                        {formatRelativeTime(reply.createdAt)}
                      </p>
                    </div>
                    {!reply.isOptimistic && (
                      <button className="text-muted hover:text-ink transition-colors btn-interactive">
                        <MoreVertical size={18} />
                      </button>
                    )}
                  </div>

                  {/* Content */}
                  <p className="text-sm text-ink leading-relaxed mb-4">
                    {reply.content}
                  </p>

                  {/* Actions */}
                  {!reply.isOptimistic && (
                    <div className="flex items-center gap-2">
                      <button className="btn-interactive text-xs font-medium text-muted hover:text-ink transition-colors px-2.5 py-1.5 rounded-lg border border-transparent hover:border-border">
                        Balas
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Reply Form */}
        {!thread.isLocked ? (
          <div className="rounded-2xl bg-white p-5 border border-border shadow-sm">
            <h3 className="text-base font-bold font-display text-navy mb-4">
              Tulis Balasan
            </h3>
            <form onSubmit={handleSubmitReply}>
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Bagikan pendapat atau pengalaman Anda..."
                rows={4}
                className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-ink placeholder:text-muted focus:border-blue focus:outline-none focus:ring-2 focus:ring-blue/20 resize-none mb-3 transition-all duration-200"
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted">
                  Gunakan bahasa yang sopan dan konstruktif
                </p>
                <button
                  type="submit"
                  disabled={!replyContent.trim() || isSubmitting}
                  className="btn-interactive flex items-center gap-2 rounded-xl bg-navy px-5 py-2.5 text-sm font-medium text-white hover:bg-navy/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={16} />
                  {isSubmitting ? "Mengirim..." : "Kirim Balasan"}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="rounded-2xl bg-surface p-6 border border-border text-center">
            <Lock size={32} className="mx-auto text-muted mb-2" />
            <p className="text-sm font-medium text-ink">
              Thread ini telah dikunci
            </p>
            <p className="text-xs text-muted mt-1">
              Tidak dapat menambahkan balasan baru
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
