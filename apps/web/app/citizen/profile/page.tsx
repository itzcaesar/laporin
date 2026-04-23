// ── app/citizen/profile/page.tsx ──
// User profile page

"use client";

import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useGamification } from "@/hooks/useGamification";
import { Mail, Phone, LogOut, FileText, Bookmark, Trophy, Award, Flame, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import LoadingSkeleton from "@/components/dashboard/shared/LoadingSkeleton";
import EmptyState from "@/components/dashboard/shared/EmptyState";

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const { profile, isLoading, error, refetch } = useProfile();
  const { data: gamificationData, isLoading: isGamificationLoading } = useGamification();
  const router = useRouter();

  // Loading state
  if (isLoading || isGamificationLoading) {
    return (
      <div className="dashboard-page">
        <div className="max-w-4xl mx-auto">
          <div className="hidden md:block mb-6">
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-2" />
            <div className="h-4 w-64 bg-gray-200 rounded animate-pulse" />
          </div>
          <LoadingSkeleton variant="report-card" />
          <div className="mt-4">
            <LoadingSkeleton variant="kpi-card" />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !profile) {
    return (
      <div className="dashboard-page">
        <div className="max-w-4xl mx-auto">
          <EmptyState
            icon="❌"
            title="Gagal memuat profil"
            message={error ?? "Terjadi kesalahan saat memuat profil Anda."}
            action={{ label: "Coba Lagi", href: "#" }}
          />
          <Button
            variant="outline"
            onClick={refetch}
            className="w-full mt-4"
          >
            Coba Lagi
          </Button>
        </div>
      </div>
    );
  }

  // Calculate stats from profile data
  const stats = {
    totalReports: profile.stats.totalReports,
    totalComments: profile.stats.totalComments,
    totalVotes: profile.stats.totalVotes,
  };

  // Map real gamification data
  const gamification = {
    level: gamificationData?.currentLevel || "Bronze",
    levelIcon: gamificationData?.currentLevel === "Bronze" ? "🥉" : gamificationData?.currentLevel === "Silver" ? "🥈" : gamificationData?.currentLevel === "Gold" ? "🥇" : "🏆",
    points: gamificationData?.totalPoints || 0,
    nextLevelPoints: gamificationData?.nextLevel?.minPoints || 100,
    currentStreak: gamificationData?.currentStreak || 0,
    badgesUnlocked: gamificationData?.badges.filter(b => b.unlocked).length || 0,
    badgesTotal: gamificationData?.badges.length || 0,
    impactScore: gamificationData?.impactScore || 0,
  };

  const progressPercent = gamificationData?.nextLevel 
    ? ((gamification.points - gamificationData.levelInfo.minPoints) / gamificationData.nextLevel.pointsNeeded) * 100
    : 100;

  return (
    <div className="dashboard-page">
      <div className="max-w-4xl mx-auto">
        {/* Page Title - Desktop */}
        <div className="hidden md:block mb-6">
          <h1 className="text-2xl font-bold font-display text-navy">
            Profil Saya
          </h1>
          <p className="text-sm text-muted mt-1">
            Kelola informasi dan lihat statistik laporan kamu
          </p>
        </div>

        {/* Profile Header */}
        <div className="card-base p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-start gap-4">
            {/* Avatar */}
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-navy text-3xl font-bold text-white shrink-0">
              {profile.name?.charAt(0).toUpperCase() || "U"}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold font-display text-navy mb-1">
                {profile.name || "Pengguna"}
              </h2>
              <p className="text-sm text-muted mb-3">
                Warga • Bergabung sejak{" "}
                {new Date(profile.createdAt).toLocaleDateString("id-ID", {
                  month: "long",
                  year: "numeric",
                })}
              </p>

              {/* Contact Info */}
              <div className="space-y-2">
                {profile.email && (
                  <div className="flex items-center gap-2 text-sm text-ink">
                    <Mail size={16} className="text-muted" />
                    <span>{profile.email}</span>
                  </div>
                )}
                {profile.phone && (
                  <div className="flex items-center gap-2 text-sm text-ink">
                    <Phone size={16} className="text-muted" />
                    <span>{profile.phone}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="card-base p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-light">
                <FileText size={20} className="text-blue" />
              </div>
              <div>
                <p className="text-2xl font-bold font-display text-navy">
                  {stats.totalReports}
                </p>
                <p className="text-xs text-muted">Total Laporan</p>
              </div>
            </div>
          </div>

          <div className="card-base p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                <FileText size={20} className="text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold font-display text-navy">
                  {stats.totalComments}
                </p>
                <p className="text-xs text-muted">Komentar</p>
              </div>
            </div>
          </div>

          <div className="card-base p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                <TrendingUp size={20} className="text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold font-display text-navy">
                  {stats.totalVotes}
                </p>
                <p className="text-xs text-muted">Vote Diberikan</p>
              </div>
            </div>
          </div>

          <div className="card-base p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                <Trophy size={20} className="text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold font-display text-navy">
                  {gamification.impactScore}
                </p>
                <p className="text-xs text-muted">Impact Score</p>
              </div>
            </div>
          </div>
        </div>

        {/* Gamification Card */}
        <div className="card-base p-6 mb-6 bg-gradient-to-br from-blue-50 to-purple-50 border-blue/20">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Trophy size={20} className="text-blue" />
              <h3 className="text-base font-bold font-display text-navy">
                Level & Pencapaian
              </h3>
            </div>
            <button
              onClick={() => router.push("/citizen/achievements")}
              className="text-sm font-medium text-blue hover:text-blue/80 transition-colors"
            >
              Lihat Detail →
            </button>
          </div>

          {/* Level Progress */}
          <div className="flex items-center gap-4 mb-4">
            <div className="text-4xl">{gamification.levelIcon}</div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-semibold text-navy">
                    Level {gamification.level}
                  </p>
                  <p className="text-xs text-muted">
                    {gamification.points} / {gamification.nextLevelPoints} poin
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-navy">
                    {gamification.nextLevelPoints - gamification.points}
                  </p>
                  <p className="text-xs text-muted">poin ke Gold</p>
                </div>
              </div>
              <div className="relative h-2 bg-white rounded-full overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue to-purple rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-lg p-3 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Flame size={16} className="text-orange-500" />
                <p className="text-lg font-bold text-navy">
                  {gamification.currentStreak}
                </p>
              </div>
              <p className="text-xs text-muted">Hari Streak</p>
            </div>
            <div className="bg-white rounded-lg p-3 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Award size={16} className="text-purple-500" />
                <p className="text-lg font-bold text-navy">
                  {gamification.badgesUnlocked}/{gamification.badgesTotal}
                </p>
              </div>
              <p className="text-xs text-muted">Badge</p>
            </div>
            <div className="bg-white rounded-lg p-3 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <TrendingUp size={16} className="text-green-500" />
                <p className="text-lg font-bold text-navy">
                  {gamification.impactScore}
                </p>
              </div>
              <p className="text-xs text-muted">Impact</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card-base p-4 mb-6">
          <h3 className="text-sm font-semibold font-display text-navy mb-3">
            Aksi Cepat
          </h3>
          <div className="grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => router.push("/citizen/my-reports")}
              className={cn(
                "flex items-center gap-3 rounded-lg p-3 text-left transition-colors",
                "hover:bg-surface"
              )}
            >
              <FileText size={20} className="text-muted" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ink">Laporan Saya</p>
                <p className="text-xs text-muted">
                  Lihat semua laporan yang kamu buat
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => router.push("/citizen/bookmarks")}
              className={cn(
                "flex items-center gap-3 rounded-lg p-3 text-left transition-colors",
                "hover:bg-surface"
              )}
            >
              <Bookmark size={20} className="text-muted" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ink">Bookmark</p>
                <p className="text-xs text-muted">Laporan yang kamu simpan</p>
              </div>
            </button>
          </div>
        </div>

        {/* Logout Button */}
        <Button
          variant="outline"
          onClick={logout}
          className="w-full text-red-600 border-red-200 hover:bg-red-50"
        >
          <LogOut size={16} />
          Keluar
        </Button>
      </div>
    </div>
  );
}
