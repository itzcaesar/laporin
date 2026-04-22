// ── app/citizen/forum/[id]/page.tsx ──
"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Share2,
  Flag,
  Pin,
  Lock,
  MoreVertical,
  Send,
  Bookmark,
  BookmarkCheck,
} from "lucide-react";
import { cn, formatRelativeTime } from "@/lib/utils";

type Reply = {
  id: string;
  content: string;
  author: {
    name: string;
    avatar: string;
    reputation: number;
    role?: "admin" | "moderator";
  };
  upvotes: number;
  downvotes: number;
  userVote?: "up" | "down";
  createdAt: string;
  isAccepted?: boolean;
};

type Thread = {
  id: string;
  title: string;
  content: string;
  category: string;
  author: {
    name: string;
    avatar: string;
    reputation: number;
  };
  replies: Reply[];
  views: number;
  upvotes: number;
  downvotes: number;
  userVote?: "up" | "down";
  isPinned: boolean;
  isLocked: boolean;
  isBookmarked: boolean;
  createdAt: string;
};

const MOCK_THREAD: Thread = {
  id: "1",
  title: "Tips Membuat Laporan yang Efektif",
  content: `Halo semuanya! 👋

Saya ingin berbagi pengalaman tentang cara membuat laporan yang cepat ditanggapi oleh pemerintah. Setelah membuat 10+ laporan, ini beberapa tips yang saya pelajari:

## 1. Judul yang Jelas dan Spesifik
Gunakan judul yang langsung menjelaskan masalah. Contoh:
- ❌ "Jalan rusak"
- ✅ "Jalan Berlubang di Jl. Dago No. 123 Depan Indomaret"

## 2. Foto yang Berkualitas
- Ambil foto dari beberapa sudut
- Pastikan pencahayaan cukup
- Sertakan landmark untuk memudahkan lokasi

## 3. Deskripsi Detail
Jelaskan:
- Kapan masalah mulai terjadi
- Seberapa parah dampaknya
- Apakah ada bahaya langsung

## 4. Lokasi yang Akurat
Gunakan fitur pin lokasi di peta untuk memastikan petugas bisa menemukan lokasi dengan mudah.

## 5. Follow Up
Jangan lupa cek status laporan secara berkala dan berikan feedback jika sudah selesai.

Semoga membantu! Ada yang mau menambahkan? 😊`,
  category: "Tips & Trik",
  author: {
    name: "Ahmad Rizki",
    avatar: "AR",
    reputation: 245,
  },
  replies: [
    {
      id: "r1",
      content:
        "Terima kasih tipsnya! Sangat membantu. Saya juga mau tambahkan: sebaiknya lapor di jam kerja (08:00-16:00) karena biasanya lebih cepat direspon.",
      author: {
        name: "Siti Nurhaliza",
        avatar: "SN",
        reputation: 128,
      },
      upvotes: 34,
      downvotes: 2,
      userVote: "up",
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "r2",
      content:
        "Setuju banget! Foto yang jelas itu penting. Saya pernah laporan ditolak karena fotonya blur dan petugas tidak bisa verifikasi masalahnya.",
      author: {
        name: "Budi Santoso",
        avatar: "BS",
        reputation: 67,
        role: "moderator",
      },
      upvotes: 21,
      downvotes: 0,
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      isAccepted: true,
    },
    {
      id: "r3",
      content:
        "Kalau untuk kategori, gimana cara milihnya yang tepat? Kadang saya bingung antara 'Jalan Rusak' dan 'Infrastruktur'.",
      author: {
        name: "Dewi Lestari",
        avatar: "DL",
        reputation: 45,
      },
      upvotes: 12,
      downvotes: 1,
      createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    },
  ],
  views: 456,
  upvotes: 89,
  downvotes: 3,
  userVote: "up",
  isPinned: true,
  isLocked: false,
  isBookmarked: true,
  createdAt: "2026-04-15T10:00:00Z",
};

export default function ForumThreadPage() {
  const params = useParams();
  const router = useRouter();
  const [thread, setThread] = useState<Thread>(MOCK_THREAD);
  const [replyContent, setReplyContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleVote = (type: "up" | "down", replyId?: string) => {
    if (replyId) {
      // Vote on reply
      setThread((prev) => ({
        ...prev,
        replies: prev.replies.map((reply) => {
          if (reply.id === replyId) {
            const wasUpvoted = reply.userVote === "up";
            const wasDownvoted = reply.userVote === "down";
            
            if (type === "up") {
              return {
                ...reply,
                upvotes: wasUpvoted ? reply.upvotes - 1 : reply.upvotes + 1,
                downvotes: wasDownvoted ? reply.downvotes - 1 : reply.downvotes,
                userVote: wasUpvoted ? undefined : "up",
              };
            } else {
              return {
                ...reply,
                upvotes: wasUpvoted ? reply.upvotes - 1 : reply.upvotes,
                downvotes: wasDownvoted ? reply.downvotes - 1 : reply.downvotes + 1,
                userVote: wasDownvoted ? undefined : "down",
              };
            }
          }
          return reply;
        }),
      }));
    } else {
      // Vote on thread
      const wasUpvoted = thread.userVote === "up";
      const wasDownvoted = thread.userVote === "down";
      
      if (type === "up") {
        setThread((prev) => ({
          ...prev,
          upvotes: wasUpvoted ? prev.upvotes - 1 : prev.upvotes + 1,
          downvotes: wasDownvoted ? prev.downvotes - 1 : prev.downvotes,
          userVote: wasUpvoted ? undefined : "up",
        }));
      } else {
        setThread((prev) => ({
          ...prev,
          upvotes: wasUpvoted ? prev.upvotes - 1 : prev.upvotes,
          downvotes: wasDownvoted ? prev.downvotes - 1 : prev.downvotes + 1,
          userVote: wasDownvoted ? undefined : "down",
        }));
      }
    }
  };

  const handleBookmark = () => {
    setThread((prev) => ({
      ...prev,
      isBookmarked: !prev.isBookmarked,
    }));
  };

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim() || isSubmitting) return;

    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));

    const newReply: Reply = {
      id: `r${thread.replies.length + 1}`,
      content: replyContent,
      author: {
        name: "You",
        avatar: "Y",
        reputation: 0,
      },
      upvotes: 0,
      downvotes: 0,
      createdAt: new Date().toISOString(),
    };

    setThread((prev) => ({
      ...prev,
      replies: [...prev.replies, newReply],
    }));

    setReplyContent("");
    setIsSubmitting(false);
  };

  return (
    <div className="dashboard-page max-w-4xl">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-muted hover:text-ink transition-colors mb-4"
      >
        <ArrowLeft size={16} />
        Kembali ke Forum
      </button>

      {/* Thread Header */}
      <div className="rounded-2xl bg-white p-6 border border-border mb-4">
        <div className="flex items-start gap-2 mb-3">
          {thread.isPinned && <Pin size={18} className="text-blue mt-1 shrink-0" />}
          <h1 className="text-2xl font-bold font-display text-navy flex-1">
            {thread.title}
            {thread.isLocked && <Lock size={18} className="inline ml-2 text-muted" />}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-sm text-muted mb-4">
          <span className="font-medium text-blue bg-blue-light px-2.5 py-1 rounded-lg">
            {thread.category}
          </span>
          <span>•</span>
          <span>{thread.views} views</span>
          <span>•</span>
          <span>{thread.replies.length} replies</span>
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
            <p className="text-xs text-muted">{thread.author.reputation} reputation</p>
          </div>
        </div>

        {/* Content */}
        <div className="prose prose-sm max-w-none mb-6">
          <div className="whitespace-pre-wrap text-ink leading-relaxed">
            {thread.content}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-4 border-t border-border">
          <div className="flex items-center gap-1 rounded-lg border border-border bg-surface">
            <button
              onClick={() => handleVote("up")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-l-lg transition-colors",
                thread.userVote === "up"
                  ? "bg-blue text-white"
                  : "hover:bg-white"
              )}
            >
              <ThumbsUp size={16} />
              <span className="text-sm font-medium">{thread.upvotes}</span>
            </button>
            <div className="w-px h-6 bg-border" />
            <button
              onClick={() => handleVote("down")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-r-lg transition-colors",
                thread.userVote === "down"
                  ? "bg-red-500 text-white"
                  : "hover:bg-white"
              )}
            >
              <ThumbsDown size={16} />
              <span className="text-sm font-medium">{thread.downvotes}</span>
            </button>
          </div>

          <button
            onClick={handleBookmark}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors",
              thread.isBookmarked
                ? "border-blue bg-blue-light text-blue"
                : "border-border bg-surface hover:bg-white"
            )}
          >
            {thread.isBookmarked ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
            <span className="text-sm font-medium hidden sm:inline">
              {thread.isBookmarked ? "Tersimpan" : "Simpan"}
            </span>
          </button>

          <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-surface hover:bg-white transition-colors">
            <Share2 size={16} />
            <span className="text-sm font-medium hidden sm:inline">Bagikan</span>
          </button>

          <button className="ml-auto flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-surface hover:bg-white transition-colors text-muted">
            <Flag size={16} />
            <span className="text-sm font-medium hidden sm:inline">Laporkan</span>
          </button>
        </div>
      </div>

      {/* Replies */}
      <div className="mb-6">
        <h2 className="text-lg font-bold font-display text-navy mb-4">
          {thread.replies.length} Balasan
        </h2>

        <div className="space-y-4">
          {thread.replies.map((reply) => (
            <div
              key={reply.id}
              className={cn(
                "rounded-2xl bg-white p-5 border transition-all",
                reply.isAccepted
                  ? "border-green-500 bg-green-50/50"
                  : "border-border"
              )}
            >
              {/* Author */}
              <div className="flex items-start gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-navy text-white font-semibold text-sm">
                  {reply.author.avatar}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-ink">{reply.author.name}</p>
                    {reply.author.role === "moderator" && (
                      <span className="text-xs font-medium text-blue bg-blue-light px-2 py-0.5 rounded">
                        Moderator
                      </span>
                    )}
                    {reply.author.role === "admin" && (
                      <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded">
                        Admin
                      </span>
                    )}
                    {reply.isAccepted && (
                      <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded">
                        ✓ Jawaban Terbaik
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted">
                    {reply.author.reputation} reputation • {formatRelativeTime(reply.createdAt)}
                  </p>
                </div>
                <button className="text-muted hover:text-ink transition-colors">
                  <MoreVertical size={18} />
                </button>
              </div>

              {/* Content */}
              <p className="text-sm text-ink leading-relaxed mb-4">{reply.content}</p>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 rounded-lg border border-border bg-surface">
                  <button
                    onClick={() => handleVote("up", reply.id)}
                    className={cn(
                      "flex items-center gap-1.5 px-2.5 py-1.5 rounded-l-lg transition-colors",
                      reply.userVote === "up"
                        ? "bg-blue text-white"
                        : "hover:bg-white"
                    )}
                  >
                    <ThumbsUp size={14} />
                    <span className="text-xs font-medium">{reply.upvotes}</span>
                  </button>
                  <div className="w-px h-5 bg-border" />
                  <button
                    onClick={() => handleVote("down", reply.id)}
                    className={cn(
                      "flex items-center gap-1.5 px-2.5 py-1.5 rounded-r-lg transition-colors",
                      reply.userVote === "down"
                        ? "bg-red-500 text-white"
                        : "hover:bg-white"
                    )}
                  >
                    <ThumbsDown size={14} />
                    <span className="text-xs font-medium">{reply.downvotes}</span>
                  </button>
                </div>

                <button className="text-xs font-medium text-muted hover:text-ink transition-colors px-2.5 py-1.5">
                  Balas
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reply Form */}
      {!thread.isLocked ? (
        <div className="rounded-2xl bg-white p-5 border border-border">
          <h3 className="text-base font-bold font-display text-navy mb-4">
            Tulis Balasan
          </h3>
          <form onSubmit={handleSubmitReply}>
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Bagikan pendapat atau pengalaman Anda..."
              rows={4}
              className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-ink placeholder:text-muted focus:border-blue focus:outline-none focus:ring-2 focus:ring-blue/20 resize-none mb-3"
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted">
                Gunakan bahasa yang sopan dan konstruktif
              </p>
              <button
                type="submit"
                disabled={!replyContent.trim() || isSubmitting}
                className="flex items-center gap-2 rounded-xl bg-navy px-5 py-2.5 text-sm font-medium text-white hover:bg-navy/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
          <p className="text-sm font-medium text-ink">Thread ini telah dikunci</p>
          <p className="text-xs text-muted mt-1">
            Tidak dapat menambahkan balasan baru
          </p>
        </div>
      )}
    </div>
  );
}
