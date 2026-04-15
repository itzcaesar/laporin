// ── app/citizen/profile/page.tsx ──
// User profile page

"use client";

import { useAuth } from "@/hooks/useAuth";
import { User, Mail, Phone, MapPin, Calendar, LogOut, FileText, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  // Mock stats - replace with actual data
  const stats = {
    totalReports: 12,
    activeReports: 5,
    completedReports: 7,
    bookmarks: 3,
  };

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
