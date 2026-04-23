// ── app/citizen/forum/page.tsx ──
"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Plus, MessageSquare, ThumbsUp, Clock, Pin, Lock, TrendingUp } from "lucide-react";
import { cn, formatRelativeTime } from "@/lib/utils";

import { useForumList, type ForumThread } from "@/hooks/useForum";

const CATEGORIES = [
  "Semua",
  "Diskusi Umum",
  "Tips & Trik",
  "Apresiasi",
  "Pertanyaan",
  "Keluhan",
];

export default function ForumPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [sortBy, setSortBy] = useState<"recent" | "popular" | "trending">("recent");
  
  const { threads: apiThreads, isLoading } = useForumList(1, 100, selectedCategory, sortBy);

  const threads = apiThreads.map(t => ({
    ...t,
    author: {
      ...t.author,
      avatar: t.author.name.substring(0, 2).toUpperCase()
    }
  }));

  const filteredThreads = threads
    .filter((thread) => {
      const matchesSearch =
        thread.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        thread.content.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });

  return (
    <div className="dashboard-page">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-display text-navy mb-2">
            Forum Komunitas
          </h1>
          <p className="text-sm text-muted">
            Diskusi, berbagi pengalaman, dan tanya jawab dengan sesama warga
          </p>
        </div>
        <Link
          href="/citizen/forum/new"
          className="flex items-center gap-2 rounded-xl bg-navy px-4 py-2.5 text-sm font-medium text-white hover:bg-navy/90 transition-colors"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">Buat Thread</span>
        </Link>
      </div>

      {/* Search & Sort */}
      <div className="mb-6 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            type="search"
            placeholder="Cari diskusi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-border bg-white pl-10 pr-4 py-3 text-sm text-ink placeholder:text-muted focus:border-blue focus:outline-none focus:ring-2 focus:ring-blue/20"
          />
        </div>

        {/* Category & Sort */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Categories */}
          <div className="flex gap-2 overflow-x-auto pb-2 flex-1">
            {CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={cn(
                  "shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                  selectedCategory === category
                    ? "bg-navy text-white"
                    : "bg-white border border-border text-ink hover:bg-surface"
                )}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="rounded-lg border border-border bg-white px-4 py-2 text-sm text-ink focus:border-blue focus:outline-none focus:ring-2 focus:ring-blue/20"
          >
            <option value="recent">Terbaru</option>
            <option value="popular">Terpopuler</option>
            <option value="trending">Trending</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="rounded-xl bg-white p-4 border border-border">
          <p className="text-sm text-muted mb-1">Total Thread</p>
          <p className="text-2xl font-bold font-display text-navy">{threads.length}</p>
        </div>
        <div className="rounded-xl bg-white p-4 border border-border">
          <p className="text-sm text-muted mb-1">Total Balasan</p>
          <p className="text-2xl font-bold font-display text-blue">
            {threads.reduce((sum, t) => sum + t.replies, 0)}
          </p>
        </div>
        <div className="rounded-xl bg-white p-4 border border-border">
          <p className="text-sm text-muted mb-1">Total Views</p>
          <p className="text-2xl font-bold font-display text-teal">
            {threads.reduce((sum, t) => sum + t.views, 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Thread List */}
      {isLoading ? (
        <div className="flex h-32 items-center justify-center">
          <div className="text-sm text-muted">Memuat forum...</div>
        </div>
      ) : filteredThreads.length === 0 ? (
        <div className="rounded-2xl bg-white p-12 text-center border border-border">
          <MessageSquare size={48} className="mx-auto text-muted mb-4" />
          <p className="text-muted">Tidak ada thread yang ditemukan</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredThreads.map((thread) => (
            <Link
              key={thread.id}
              href={`/citizen/forum/${thread.id}`}
              className="block rounded-2xl bg-white p-5 border border-border hover:shadow-md transition-all"
            >
              <div className="flex gap-4">
                {/* Avatar */}
                <div className="shrink-0">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-navy text-white font-semibold">
                    {thread.author.avatar}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 mb-2">
                    {thread.isPinned && (
                      <Pin size={16} className="text-blue mt-1 shrink-0" />
                    )}
                    <h3 className="text-base font-semibold text-navy flex-1">
                      {thread.title}
                      {thread.isLocked && (
                        <Lock size={14} className="inline ml-2 text-muted" />
                      )}
                    </h3>
                  </div>

                  <p className="text-sm text-muted line-clamp-2 mb-3">
                    {thread.content}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
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
                      <ThumbsUp size={12} />
                      {thread.upvotes}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {formatRelativeTime(thread.lastActivity)}
                    </span>
                  </div>
                </div>

                {/* Stats */}
                <div className="hidden md:flex flex-col items-end gap-1 shrink-0">
                  <div className="flex items-center gap-1 text-sm font-semibold text-navy">
                    <TrendingUp size={14} className="text-green-600" />
                    {thread.views}
                  </div>
                  <span className="text-xs text-muted">views</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
