// ── app/citizen/profile/page.tsx ──
// User profile page

"use client";

import { useAuth } from "@/hooks/useAuth";
import { MOCK_REPORTS } from "@/data/mock-reports";
import { User, Mail, Phone, MapPin, Calendar, LogOut, FileText, Bookmark, Trophy, Award, Flame, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  // Calculate stats from mock data (first 5 reports are "mine")
  const myReports = MOCK_REPORTS.slice(0, 5);
  const stats = {
    totalReports: myReports.length,
    activeReports: myReports.filter(
      (r) => r.status === "baru" || r.status === "diverifikasi" || r.status === "diproses"
    ).length,
    completedReports: myReports.filter(
      (r) => r.status === "selesai" || r.status === "terverifikasi"
    ).length,
    bookmarks: 4, // Reports 5-8 are bookmarked
  };

  // Gamification stats
  const gamification = {
    level: "Silver",
    levelIcon: "🥈",
    points: 245,
    nextLevelPoints: 500,
    currentStreak: 7,
    badgesUnlocked: 3,
    badgesTotal: 9,
    impactScore: 456,
  };

  const progressPercent = (gamification.points / gamification.nextLevelPoints) * 100;

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
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold font-display text-navy mb-1">
                {user?.name || "Pengguna"}
              </h2>
              <p className="text-sm text-muted mb-3">
                Warga • Bergabung sejak{" "}
                {new Date().toLocaleDateString("id-ID", {
                  month: "long",
                  year: "numeric",
                })}
              </p>

              {/* Contact Info */}
              <div className="space-y-2">
                {user?.email && (
                  <div className="flex items-center gap-2 text-sm text-ink">
                    <Mail size={16} className="text-muted" />
                    <span>{user.email}</span>
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
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
                <FileText size={20} className="text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold font-display text-navy">
                  {stats.activeReports}
                </p>
                <p className="text-xs text-muted">Sedang Aktif</p>
              </div>
            </div>
          </div>

          <div className="card-base p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                <FileText size={20} className="text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold font-display text-navy">
                  {stats.completedReports}
                </p>
                <p className="text-xs text-muted">Selesai</p>
              </div>
            </div>
          </div>

          <div className="card-base p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                <Bookmark size={20} className="text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold font-display text-navy">
                  {stats.bookmarks}
                </p>
                <p className="text-xs text-muted">Bookmark</p>
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
