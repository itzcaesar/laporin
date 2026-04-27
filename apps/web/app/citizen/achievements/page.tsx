// ── app/citizen/achievements/page.tsx ──
"use client";

import { useState } from "react";
import {
  Trophy,
  Award,
  Star,
  TrendingUp,
  Users,
  Zap,
  Target,
  CheckCircle,
  Lock,
  Flame,
  Heart,
  Camera,
  MessageCircle,
  ThumbsUp,
  MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useGamification, useBadges, useLeaderboard } from "@/hooks/useGamification";
import LoadingSkeleton from "@/components/dashboard/shared/LoadingSkeleton";
import EmptyState from "@/components/dashboard/shared/EmptyState";

type Level = {
  id: string;
  name: string;
  minPoints: number;
  maxPoints: number;
  color: string;
  icon: string;
  benefits: string[];
};

const LEVELS: Level[] = [
  {
    id: "bronze",
    name: "Bronze",
    minPoints: 0,
    maxPoints: 99,
    color: "from-amber-700 to-amber-900",
    icon: "🥉",
    benefits: ["Buat laporan", "Komentar", "Upvote"],
  },
  {
    id: "silver",
    name: "Silver",
    minPoints: 100,
    maxPoints: 499,
    color: "from-gray-400 to-gray-600",
    icon: "🥈",
    benefits: ["Semua Bronze", "Badge khusus", "Prioritas notifikasi"],
  },
  {
    id: "gold",
    name: "Gold",
    minPoints: 500,
    maxPoints: 1499,
    color: "from-yellow-400 to-yellow-600",
    icon: "🥇",
    benefits: ["Semua Silver", "Akses forum VIP", "Laporan prioritas"],
  },
  {
    id: "platinum",
    name: "Platinum",
    minPoints: 1500,
    maxPoints: 9999,
    color: "from-cyan-400 to-blue-600",
    icon: "💎",
    benefits: ["Semua Gold", "Konsultasi langsung", "Badge eksklusif"],
  },
];

export default function AchievementsPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "badges" | "leaderboard">("overview");
  const [leaderboardPage, setLeaderboardPage] = useState(1);

  // Fetch data from API
  const gamification = useGamification();
  const badges = useBadges();
  const leaderboard = useLeaderboard(leaderboardPage, 20);

  // Loading state
  if (gamification.isLoading || badges.isLoading) {
    return (
      <div className="dashboard-page">
        <LoadingSkeleton variant="kpi-card" rows={4} />
      </div>
    );
  }

  // Error state
  if (gamification.error) {
    return (
      <div className="dashboard-page">
        <EmptyState
          icon="⚠️"
          title="Gagal memuat data"
          description={gamification.error}
          actionLabel="Coba Lagi"
          onAction={gamification.refetch}
        />
      </div>
    );
  }

  // No data
  if (!gamification.data) {
    return (
      <div className="dashboard-page">
        <EmptyState
          icon="🎮"
          title="Data gamifikasi tidak tersedia"
          description="Mulai buat laporan untuk mendapatkan poin dan badge!"
        />
      </div>
    );
  }

  const stats = gamification.data;
  const currentLevel = LEVELS.find((l) => l.id === stats.currentLevel) || LEVELS[0];
  const nextLevel = stats.nextLevel
    ? LEVELS.find((l) => l.name === stats.nextLevel?.name)
    : null;
  const pointsToNext = stats.nextLevel?.pointsNeeded || 0;
  const progressPercent =
    ((stats.totalPoints - currentLevel.minPoints) /
      (currentLevel.maxPoints - currentLevel.minPoints)) *
    100;

  const badgesUnlocked = badges.data.filter((b) => b.unlocked).length;
  const badgesTotal = badges.data.length;

  return (
    <div className="dashboard-page">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-display text-navy mb-2">
          Pencapaian & Level
        </h1>
        <p className="text-sm text-muted">
          Tingkatkan level Anda dan raih badge eksklusif
        </p>
      </div>

      {/* Current Level Card */}
      <div className="rounded-2xl bg-gradient-to-br from-navy to-blue p-6 mb-6 text-white">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-4xl">{currentLevel.icon}</span>
              <div>
                <p className="text-sm opacity-80">Level Anda</p>
                <h2 className="text-2xl font-bold font-display">
                  {currentLevel.name}
                </h2>
              </div>
            </div>
            <p className="text-sm opacity-90 mb-1">
              {stats.totalPoints} / {currentLevel.maxPoints} poin
            </p>
            {nextLevel && (
              <p className="text-xs opacity-75">
                {pointsToNext} poin lagi ke {nextLevel.name}
              </p>
            )}
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 mb-2">
              <Flame size={20} className="text-orange-400" />
              <div>
                <p className="text-2xl font-bold">{stats.currentStreak}</p>
                <p className="text-xs opacity-75">hari streak</p>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="relative h-3 bg-white/20 rounded-full overflow-hidden mb-4">
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Benefits */}
        <div className="flex flex-wrap gap-2">
          {currentLevel.benefits.map((benefit, index) => (
            <span
              key={index}
              className="text-xs bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full"
            >
              ✓ {benefit}
            </span>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl bg-white p-4 border border-border">
          <div className="flex items-center gap-2 mb-2">
            <Target size={18} className="text-blue-600" />
            <p className="text-xs text-muted">Total Laporan</p>
          </div>
          <p className="text-2xl font-bold font-display text-navy">
            {stats.stats.totalReports}
          </p>
        </div>

        <div className="rounded-xl bg-white p-4 border border-border">
          <div className="flex items-center gap-2 mb-2">
            <Heart size={18} className="text-red-600" />
            <p className="text-xs text-muted">Impact Score</p>
          </div>
          <p className="text-2xl font-bold font-display text-navy">
            {stats.impactScore}
          </p>
        </div>

        <div className="rounded-xl bg-white p-4 border border-border">
          <div className="flex items-center gap-2 mb-2">
            <ThumbsUp size={18} className="text-orange-600" />
            <p className="text-xs text-muted">Total Upvotes</p>
          </div>
          <p className="text-2xl font-bold font-display text-navy">
            {stats.stats.totalUpvotes}
          </p>
        </div>

        <div className="rounded-xl bg-white p-4 border border-border">
          <div className="flex items-center gap-2 mb-2">
            <Award size={18} className="text-purple-600" />
            <p className="text-xs text-muted">Badge</p>
          </div>
          <p className="text-2xl font-bold font-display text-navy">
            {badgesUnlocked}/{badgesTotal}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-border">
        <button
          onClick={() => setActiveTab("overview")}
          className={cn(
            "px-4 py-3 text-sm font-medium transition-colors border-b-2",
            activeTab === "overview"
              ? "border-navy text-navy"
              : "border-transparent text-muted hover:text-ink"
          )}
        >
          Level System
        </button>
        <button
          onClick={() => setActiveTab("badges")}
          className={cn(
            "px-4 py-3 text-sm font-medium transition-colors border-b-2",
            activeTab === "badges"
              ? "border-navy text-navy"
              : "border-transparent text-muted hover:text-ink"
          )}
        >
          Badge ({badgesUnlocked}/{badgesTotal})
        </button>
        <button
          onClick={() => setActiveTab("leaderboard")}
          className={cn(
            "px-4 py-3 text-sm font-medium transition-colors border-b-2",
            activeTab === "leaderboard"
              ? "border-navy text-navy"
              : "border-transparent text-muted hover:text-ink"
          )}
        >
          Leaderboard
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="space-y-4">
          {LEVELS.map((level, index) => {
            const isCurrentLevel = level.id === stats.currentLevel;
            const isPastLevel = level.maxPoints < stats.totalPoints;
            const isFutureLevel = level.minPoints > stats.totalPoints;

            return (
              <div
                key={level.id}
                className={cn(
                  "rounded-2xl p-5 border transition-all",
                  isCurrentLevel && "bg-blue-light border-blue shadow-md",
                  isPastLevel && "bg-surface border-border opacity-60",
                  isFutureLevel && "bg-white border-border"
                )}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      "flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-3xl",
                      `bg-gradient-to-br ${level.color}`
                    )}
                  >
                    {level.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-bold font-display text-navy">
                        {level.name}
                      </h3>
                      {isCurrentLevel && (
                        <span className="text-xs font-semibold text-blue bg-blue/10 px-2 py-1 rounded-full">
                          Level Saat Ini
                        </span>
                      )}
                      {isPastLevel && (
                        <CheckCircle size={16} className="text-green-600" />
                      )}
                      {isFutureLevel && (
                        <Lock size={16} className="text-muted" />
                      )}
                    </div>
                    <p className="text-sm text-muted mb-3">
                      {level.minPoints} - {level.maxPoints} poin
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {level.benefits.map((benefit, i) => (
                        <span
                          key={i}
                          className="text-xs bg-surface px-3 py-1 rounded-full text-ink"
                        >
                          {benefit}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === "badges" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {badges.isLoading ? (
            <div className="col-span-full">
              <LoadingSkeleton variant="kpi-card" rows={6} />
            </div>
          ) : badges.error ? (
            <div className="col-span-full">
              <EmptyState
                icon="⚠️"
                title="Gagal memuat badge"
                description={badges.error}
                actionLabel="Coba Lagi"
                onAction={badges.refetch}
              />
            </div>
          ) : badges.data.length === 0 ? (
            <div className="col-span-full">
              <EmptyState
                icon="🏆"
                title="Belum ada badge"
                description="Badge akan muncul setelah Anda mulai berkontribusi"
              />
            </div>
          ) : (
            badges.data.map((badge) => {
              // Map icon string to Lucide icon component
              const iconMap: Record<string, any> = {
                Award,
                Star,
                CheckCircle,
                Camera,
                MessageCircle,
                ThumbsUp,
                MapPin,
                Flame,
                Heart,
                Trophy,
              };
              const Icon = iconMap[badge.icon] || Award;

              return (
                <div
                  key={badge.id}
                  className={cn(
                    "rounded-2xl p-5 border transition-all",
                    badge.unlocked
                      ? "bg-white border-border hover:shadow-md"
                      : "bg-surface border-border opacity-60"
                  )}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className={cn("p-3 rounded-xl", badge.color)}>
                      <Icon size={24} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-bold font-display text-navy mb-1">
                        {badge.name}
                      </h3>
                      <p className="text-xs text-muted">{badge.description}</p>
                    </div>
                    {badge.unlocked && (
                      <CheckCircle size={20} className="text-green-600 shrink-0" />
                    )}
                  </div>

                  {badge.target && badge.target > 0 && (
                    <div>
                      <div className="flex items-center justify-between text-xs text-muted mb-2">
                        <span>Progress</span>
                        <span>
                          {badge.progress}/{badge.target}
                        </span>
                      </div>
                      <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "absolute inset-y-0 left-0 rounded-full transition-all",
                            badge.unlocked ? "bg-green-500" : "bg-blue-500"
                          )}
                          style={{
                            width: `${Math.min((badge.progress / badge.target) * 100, 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {badge.unlocked && badge.unlockedAt && (
                    <p className="text-xs text-muted mt-3">
                      Dibuka pada{" "}
                      {new Date(badge.unlockedAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {activeTab === "leaderboard" && (
        <div className="rounded-2xl bg-white border border-border overflow-hidden">
          <div className="p-5 border-b border-border bg-surface">
            <div className="flex items-center gap-2">
              <Trophy size={20} className="text-yellow-600" />
              <h2 className="text-lg font-bold font-display text-navy">
                Top Contributors
              </h2>
            </div>
            <p className="text-xs text-muted mt-1">
              Peringkat berdasarkan poin bulan ini
            </p>
          </div>

          {leaderboard.isLoading ? (
            <div className="p-5">
              <LoadingSkeleton variant="table" rows={1} />
            </div>
          ) : leaderboard.error ? (
            <div className="p-5">
              <EmptyState
                icon="⚠️"
                title="Gagal memuat leaderboard"
                description={leaderboard.error}
                actionLabel="Coba Lagi"
                onAction={leaderboard.refetch}
              />
            </div>
          ) : leaderboard.data.length === 0 ? (
            <div className="p-5">
              <EmptyState
                icon="🏆"
                title="Belum ada data leaderboard"
                description="Leaderboard akan muncul setelah ada kontributor aktif"
              />
            </div>
          ) : (
            <>
              <div className="divide-y divide-border">
                {leaderboard.data.map((entry) => (
                  <div
                    key={entry.userId}
                    className={cn(
                      "flex items-center gap-4 p-5 transition-colors",
                      entry.isCurrentUser ? "bg-blue-light" : "hover:bg-surface"
                    )}
                  >
                    {/* Rank */}
                    <div className="flex items-center justify-center w-12 shrink-0">
                      {entry.rank <= 3 ? (
                        <span className="text-2xl">
                          {entry.rank === 1 && "🥇"}
                          {entry.rank === 2 && "🥈"}
                          {entry.rank === 3 && "🥉"}
                        </span>
                      ) : (
                        <span className="text-lg font-bold text-muted">
                          #{entry.rank}
                        </span>
                      )}
                    </div>

                    {/* Avatar */}
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-navy text-white font-semibold">
                      {entry.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-navy">
                          {entry.name}
                        </h3>
                        {entry.isCurrentUser && (
                          <span className="text-xs font-semibold text-blue bg-blue/10 px-2 py-0.5 rounded-full">
                            Anda
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted">
                        {entry.level} • {entry.reports} laporan
                      </p>
                    </div>

                    {/* Points */}
                    <div className="text-right shrink-0">
                      <p className="text-lg font-bold font-display text-navy">
                        {entry.points.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted">poin</p>
                    </div>
                  </div>
                ))}
              </div>

              {leaderboard.meta.pages > 1 && (
                <div className="p-4 bg-surface text-center border-t border-border">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => setLeaderboardPage((p) => Math.max(1, p - 1))}
                      disabled={leaderboardPage === 1}
                      className="px-4 py-2 text-sm font-medium text-navy bg-white border border-border rounded-lg hover:bg-surface disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Sebelumnya
                    </button>
                    <span className="text-sm text-muted">
                      Halaman {leaderboardPage} dari {leaderboard.meta.pages}
                    </span>
                    <button
                      onClick={() =>
                        setLeaderboardPage((p) =>
                          Math.min(leaderboard.meta.pages, p + 1)
                        )
                      }
                      disabled={leaderboardPage === leaderboard.meta.pages}
                      className="px-4 py-2 text-sm font-medium text-navy bg-white border border-border rounded-lg hover:bg-surface disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Selanjutnya
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
