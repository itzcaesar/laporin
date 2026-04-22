// ── app/gov/forum/page.tsx ──
"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Search,
  Filter,
  Pin,
  Lock,
  Unlock,
  Trash2,
  Eye,
  MessageSquare,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { cn, formatRelativeTime } from "@/lib/utils";

type ThreadStatus = "active" | "locked" | "flagged" | "deleted";

type ForumThread = {
  id: string;
  title: string;
  category: string;
  author: {
    name: string;
    email: string;
  };
  replies: number;
  views: number;
  upvotes: number;
  isPinned: boolean;
  status: ThreadStatus;
  flagCount: number;
  lastActivity: string;
  createdAt: string;
};

const MOCK_THREADS: ForumThread[] = [
  {
    id: "1",
    title: "Tips Membuat Laporan yang Efektif",
    category: "Tips & Trik",
    author: {
      name: "Ahmad Rizki",
      email: "ahmad@example.com",
    },
    replies: 23,
    views: 456,
    upvotes: 89,
    isPinned: true,
    status: "active",
    flagCount: 0,
    lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    createdAt: "2026-04-15T10:00:00Z",
  },
  {
    id: "2",
    title: "Jalan Rusak di Dago Masih Belum Diperbaiki",
    category: "Diskusi Umum",
    author: {
      name: "Siti Nurhaliza",
      email: "siti@example.com",
    },
    replies: 15,
    views: 234,
    upvotes: 34,
    isPinned: false,
    status: "active",
    flagCount: 0,
    lastActivity: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    createdAt: "2026-04-20T14:30:00Z",
  },
  {
    id: "3",
    title: "SPAM: Jual Obat Murah!!!",
    category: "Diskusi Umum",
    author: {
      name: "Spammer",
      email: "spam@example.com",
    },
    replies: 2,
    views: 45,
    upvotes: 0,
    isPinned: false,
    status: "flagged",
    flagCount: 12,
    lastActivity: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    createdAt: "2026-04-22T08:00:00Z",
  },
  {
    id: "4",
    title: "Diskusi Lama yang Sudah Selesai",
    category: "Pertanyaan",
    author: {
      name: "Budi Santoso",
      email: "budi@example.com",
    },
    replies: 45,
    views: 890,
    upvotes: 67,
    isPinned: false,
    status: "locked",
    flagCount: 0,
    lastActivity: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: "2026-03-15T10:00:00Z",
  },
];

const STATUS_CONFIG = {
  active: {
    label: "Aktif",
    color: "text-green-600 bg-green-50",
    icon: CheckCircle,
  },
  locked: {
    label: "Terkunci",
    color: "text-gray-600 bg-gray-50",
    icon: Lock,
  },
  flagged: {
    label: "Dilaporkan",
    color: "text-red-600 bg-red-50",
    icon: AlertTriangle,
  },
  deleted: {
    label: "Dihapus",
    color: "text-gray-400 bg-gray-50",
    icon: XCircle,
  },
};

export default function GovForumPage() {
  const [threads, setThreads] = useState<ForumThread[]>(MOCK_THREADS);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ThreadStatus | "all">("all");
  const [sortBy, setSortBy] = useState<"recent" | "flagged" | "popular">("recent");

  const filteredThreads = threads
    .filter((thread) => {
      const matchesSearch =
        thread.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        thread.author.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || thread.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "flagged":
          return b.flagCount - a.flagCount;
        case "popular":
          return b.views - a.views;
        default:
          return new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime();
      }
    });

  const handleTogglePin = (id: string) => {
    setThreads((prev) =>
      prev.map((thread) =>
        thread.id === id ? { ...thread, isPinned: !thread.isPinned } : thread
      )
    );
  };

  const handleToggleLock = (id: string) => {
    setThreads((prev) =>
      prev.map((thread) =>
        thread.id === id
          ? {
              ...thread,
              status: thread.status === "locked" ? "active" : "locked",
            }
          : thread
      )
    );
  };

  const handleDelete = (id: string) => {
    if (confirm("Yakin ingin menghapus thread ini?")) {
      setThreads((prev) =>
        prev.map((thread) =>
          thread.id === id ? { ...thread, status: "deleted" } : thread
        )
      );
    }
  };

  const stats = {
    total: threads.length,
    active: threads.filter((t) => t.status === "active").length,
    flagged: threads.filter((t) => t.status === "flagged").length,
    locked: threads.filter((t) => t.status === "locked").length,
  };

  return (
    <div className="dashboard-page">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-display text-navy mb-2">
          Moderasi Forum
        </h1>
        <p className="text-sm text-muted">
          Kelola dan moderasi diskusi komunitas
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl bg-white p-4 border border-border">
          <p className="text-sm text-muted mb-1">Total Thread</p>
          <p className="text-2xl font-bold font-display text-navy">{stats.total}</p>
        </div>
        <div className="rounded-xl bg-white p-4 border border-border">
          <p className="text-sm text-muted mb-1">Aktif</p>
          <p className="text-2xl font-bold font-display text-green-600">{stats.active}</p>
        </div>
        <div className="rounded-xl bg-white p-4 border border-border">
          <p className="text-sm text-muted mb-1">Dilaporkan</p>
          <p className="text-2xl font-bold font-display text-red-600">{stats.flagged}</p>
        </div>
        <div className="rounded-xl bg-white p-4 border border-border">
          <p className="text-sm text-muted mb-1">Terkunci</p>
          <p className="text-2xl font-bold font-display text-gray-600">{stats.locked}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-2xl bg-white p-5 border border-border mb-6">
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              type="search"
              placeholder="Cari thread atau pengguna..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface pl-10 pr-4 py-3 text-sm text-ink placeholder:text-muted focus:border-blue focus:outline-none focus:ring-2 focus:ring-blue/20"
            />
          </div>

          {/* Status & Sort */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-muted mb-2">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink focus:border-blue focus:outline-none focus:ring-2 focus:ring-blue/20"
              >
                <option value="all">Semua Status</option>
                <option value="active">Aktif</option>
                <option value="flagged">Dilaporkan</option>
                <option value="locked">Terkunci</option>
                <option value="deleted">Dihapus</option>
              </select>
            </div>

            <div className="flex-1">
              <label className="block text-xs font-medium text-muted mb-2">
                Urutkan
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink focus:border-blue focus:outline-none focus:ring-2 focus:ring-blue/20"
              >
                <option value="recent">Terbaru</option>
                <option value="flagged">Paling Banyak Dilaporkan</option>
                <option value="popular">Terpopuler</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Thread List */}
      {filteredThreads.length === 0 ? (
        <div className="rounded-2xl bg-white p-12 text-center border border-border">
          <MessageSquare size={48} className="mx-auto text-muted mb-4" />
          <p className="text-muted">Tidak ada thread yang ditemukan</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredThreads.map((thread) => {
            const StatusIcon = STATUS_CONFIG[thread.status].icon;
            
            return (
              <div
                key={thread.id}
                className={cn(
                  "rounded-2xl bg-white p-5 border transition-all",
                  thread.status === "flagged"
                    ? "border-red-500 bg-red-50/30"
                    : "border-border"
                )}
              >
                <div className="flex gap-4">
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 mb-2">
                      {thread.isPinned && (
                        <Pin size={16} className="text-blue mt-1 shrink-0" />
                      )}
                      <div className="flex-1">
                        <Link
                          href={`/citizen/forum/${thread.id}`}
                          className="text-base font-semibold text-navy hover:text-blue transition-colors"
                        >
                          {thread.title}
                        </Link>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted mb-3">
                      <span className="font-medium text-ink">{thread.author.name}</span>
                      <span>•</span>
                      <span className="text-xs font-medium text-blue bg-blue-light px-2 py-0.5 rounded">
                        {thread.category}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <MessageSquare size={12} />
                        {thread.replies}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Eye size={12} />
                        {thread.views}
                      </span>
                      <span>•</span>
                      <span>{formatRelativeTime(thread.lastActivity)}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded",
                          STATUS_CONFIG[thread.status].color
                        )}
                      >
                        <StatusIcon size={12} />
                        {STATUS_CONFIG[thread.status].label}
                      </span>
                      {thread.flagCount > 0 && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded">
                          <AlertTriangle size={12} />
                          {thread.flagCount} laporan
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 shrink-0">
                    <button
                      onClick={() => handleTogglePin(thread.id)}
                      className={cn(
                        "p-2 rounded-lg transition-colors",
                        thread.isPinned
                          ? "bg-blue text-white"
                          : "bg-surface text-muted hover:bg-gray-100"
                      )}
                      title={thread.isPinned ? "Unpin" : "Pin"}
                    >
                      <Pin size={16} />
                    </button>
                    <button
                      onClick={() => handleToggleLock(thread.id)}
                      className={cn(
                        "p-2 rounded-lg transition-colors",
                        thread.status === "locked"
                          ? "bg-gray-600 text-white"
                          : "bg-surface text-muted hover:bg-gray-100"
                      )}
                      title={thread.status === "locked" ? "Unlock" : "Lock"}
                    >
                      {thread.status === "locked" ? (
                        <Lock size={16} />
                      ) : (
                        <Unlock size={16} />
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(thread.id)}
                      className="p-2 rounded-lg bg-surface text-red-600 hover:bg-red-50 transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
