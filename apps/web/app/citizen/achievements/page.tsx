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

type Level = {
  id: string;
  name: string;
  minPoints: number;
  maxPoints: number;
  color: string;
  icon: string;
  benefits: string[];
};

type Badge = {
  id: string;
  name: string;
  description: string;
  icon: typeof Trophy;
  color: string;
  unlocked: boolean;
  unlockedAt?: string;
  progress?: number;
  target?: number;
};

type LeaderboardEntry = {
  rank: number;
  name: string;
  avatar: string;
  level: string;
  points: number;
  reports: number;
  isCurrentUser?: boolean;
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

const BADGES: Badge[] = [
  {
    id: "first-report",
    name: "Pelapor Pemula",
    description: "Buat laporan pertama Anda",
    icon: Award,
    color: "text-blue-600 bg-blue-50",
    unlocked: true,
    unlockedAt: "2026-04-15",
  },
  {
    id: "10-reports",
    name: "Kontributor Aktif",
    description: "Buat 10 laporan",
    icon: Star,
    color: "text-purple-600 bg-purple-50",
    unlocked: true,
    unlockedAt: "2026-04-18",
    progress: 10,
    target: 10,
  },
  {
    id: "verified-reporter",
    name: "Pelapor Terverifikasi",
    description: "5 laporan Anda diverifikasi",
    icon: CheckCircle,
    color: "text-green-600 bg-green-50",
    unlocked: true,
    unlockedAt: "2026-04-20",
    progress: 5,
    target: 5,
  },
  {
    id: "photo-master",
    name: "Master Fotografi",
    description: "Upload 20 foto berkualitas",
    icon: Camera,
    color: "text-pink-600 bg-pink-50",
    unlocked: false,
    progress: 12,
    target: 20,
  },
  {
    id: "community-helper",
    name: "Pembantu Komunitas",
    description: "Bantu 50 warga dengan komentar",
    icon: MessageCircle,
    color: "text-indigo-600 bg-indigo-50",
    unlocked: false,
    progress: 28,
    target: 50,
  },
  {
    id: "popular-reporter",
    name: "Pelapor Populer",
    description: "Dapatkan 100 upvotes",
    icon: ThumbsUp,
    color: "text-orange-600 bg-orange-50",
    unlocked: false,
    progress: 67,
    target: 100,
  },
  {
    id: "area-expert",
    name: "Ahli Area",
    description: "Laporkan 10 masalah di area yang sama",
    icon: MapPin,
    color: "text-red-600 bg-red-50",
    unlocked: false,
    progress: 6,
    target: 10,
  },
  {
    id: "streak-master",
    name: "Master Konsistensi",
    description: "Lapor 30 hari berturut-turut",
    icon: Flame,
    color: "text-yellow-600 bg-yellow-50",
    unlocked: false,
    progress: 7,
    target: 30,
  },
  {
    id: "impact-hero",
    name: "Pahlawan Dampak",
    description: "Laporan Anda membantu 1000+ warga",
    icon: Heart,
    color: "text-rose-600 bg-rose-50",
    unlocked: false,
    progress: 456,
    target: 1000,
  },
];

const LEADERBOARD: LeaderboardEntry[] = [
  {
    rank: 1,
    name: "Ahmad Rizki",
    avatar: "AR",
    level: "Platinum",
    points: 2450,
    reports: 87,
  },
  {
    rank: 2,
    name: "Siti Nurhaliza",
    avatar: "SN",
    level: "Gold",
    points: 1820,
    reports: 64,
  },
  {
    rank: 3,
    name: "Budi Santoso",
    avatar: "BS",
    level: "Gold",
    points: 1560,
    reports: 52,
  },
  {
    rank: 4,
    name: "Anda",
    avatar: "A",
    level: "Silver",
    points: 245,
    reports: 12,
    isCurrentUser: true,
  },
  {
    rank: 5,
    name: "Dewi Lestari",
    avatar: "DL",
    level: "Silver",
    points: 198,
    reports: 9,
  },
];

export default function AchievementsPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "badges" | "leaderboard">("overview");

  // Current user stats
  const currentLevel = LEVELS[1]; // Silver
  const currentPoints = 245;
  const nextLevel = LEVELS[2]; // Gold
  const pointsToNext = nextLevel.minPoints - currentPoints;
  const progressPercent = ((currentPoints - currentLevel.minPoints) / (currentLevel.maxPoints - currentLevel.minPoints)) * 100;

  const stats = {
    totalReports: 12,
    verifiedReports: 5,
    completedReports: 3,
    impactScore: 456,
    currentStreak: 7,
    longestStreak: 12,
    totalUpvotes: 67,
    badgesUnlocked: BADGES.filter((b) => b.unlocked).length,
    badgesTotal: BADGES.length,
  };

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
              {currentPoints} / {currentLevel.maxPoints} poin
            </p>
            <p className="text-xs opacity-75">
              {pointsToNext} poin lagi ke {nextLevel.name}
            </p>
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
            {stats.totalReports}
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
            {stats.totalUpvotes}
          </p>
        </div>

        <div className="rounded-xl bg-white p-4 border border-border">
          <div className="flex items-center gap-2 mb-2">
            <Award size={18} className="text-purple-600" />
            <p className="text-xs text-muted">Badge</p>
          </div>
          <p className="text-2xl font-bold font-display text-navy">
            {stats.badgesUnlocked}/{stats.badgesTotal}
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
          Badge ({stats.badgesUnlocked}/{stats.badgesTotal})
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
            const isCurrentLevel = level.id === currentLevel.id;
            const isPastLevel = level.maxPoints < currentPoints;
            const isFutureLevel = level.minPoints > currentPoints;

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
          {BADGES.map((badge) => {
            const Icon = badge.icon;
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

                {badge.progress !== undefined && badge.target && (
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
                          width: `${(badge.progress / badge.target) * 100}%`,
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
          })}
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

          <div className="divide-y divide-border">
            {LEADERBOARD.map((entry) => (
              <div
                key={entry.rank}
                className={cn(
                  "flex items-center gap-4 p-5 transition-colors",
                  entry.isCurrentUser
                    ? "bg-blue-light"
                    : "hover:bg-surface"
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
                  {entry.avatar}
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

          <div className="p-4 bg-surface text-center">
            <button className="text-sm font-medium text-blue hover:text-blue/80 transition-colors">
              Lihat Semua Peringkat →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
