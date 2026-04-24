// ── app/gov/profile/page.tsx ──
// Government officer / admin profile page

"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import {
  Mail,
  Phone,
  LogOut,
  Building2,
  Shield,
  BadgeCheck,
  FileText,
  MessageSquare,
  Edit2,
  Save,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import LoadingSkeleton from "@/components/dashboard/shared/LoadingSkeleton";
import EmptyState from "@/components/dashboard/shared/EmptyState";

const ROLE_LABELS: Record<string, string> = {
  officer: "Petugas",
  admin: "Admin",
  super_admin: "Super Admin",
};

const ROLE_COLORS: Record<string, string> = {
  officer: "bg-blue-100 text-blue-700",
  admin: "bg-purple-100 text-purple-700",
  super_admin: "bg-red-100 text-red-700",
};

export default function GovProfilePage() {
  const { user, logout } = useAuth();
  const { profile, isLoading, error, isUpdating, updateProfile, refetch } =
    useProfile();
  const router = useRouter();

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [updateError, setUpdateError] = useState<string | null>(null);

  const handleEditStart = () => {
    setEditName(profile?.name ?? "");
    setEditPhone(profile?.phone ?? "");
    setUpdateError(null);
    setIsEditing(true);
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    setUpdateError(null);
  };

  const handleEditSave = async () => {
    try {
      setUpdateError(null);
      await updateProfile({
        name: editName.trim() || undefined,
        phone: editPhone.trim() || undefined,
      });
      setIsEditing(false);
    } catch (err: any) {
      setUpdateError(err?.userMessage ?? "Gagal memperbarui profil.");
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="dashboard-page">
        <div className="max-w-3xl mx-auto">
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
        <div className="max-w-3xl mx-auto">
          <EmptyState
            icon="❌"
            title="Gagal memuat profil"
            message={error ?? "Terjadi kesalahan saat memuat profil Anda."}
            action={{ label: "Coba Lagi", href: "#" }}
          />
          <Button variant="outline" onClick={refetch} className="w-full mt-4">
            Coba Lagi
          </Button>
        </div>
      </div>
    );
  }

  const roleLabel = ROLE_LABELS[profile.role] ?? profile.role;
  const roleColor = ROLE_COLORS[profile.role] ?? "bg-gray-100 text-gray-700";

  return (
    <div className="dashboard-page">
      <div className="max-w-3xl mx-auto">
        {/* Page Title */}
        <div className="hidden md:block mb-6">
          <h1 className="text-2xl font-bold font-display text-navy">
            Profil Saya
          </h1>
          <p className="text-sm text-muted mt-1">
            Informasi akun dan data petugas
          </p>
        </div>

        {/* Profile Header Card */}
        <div className="card-base p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-start gap-4">
            {/* Avatar */}
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-navy text-3xl font-bold text-white shrink-0">
              {profile.name?.charAt(0).toUpperCase() ?? "P"}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              {isEditing ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-muted mb-1 block">
                      Nama
                    </label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full rounded-lg border border-border px-3 py-2 text-sm text-ink focus:border-blue focus:outline-none focus:ring-2 focus:ring-blue/20"
                      placeholder="Nama lengkap"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted mb-1 block">
                      Nomor Telepon
                    </label>
                    <input
                      type="tel"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      className="w-full rounded-lg border border-border px-3 py-2 text-sm text-ink focus:border-blue focus:outline-none focus:ring-2 focus:ring-blue/20"
                      placeholder="08xxxxxxxxxx"
                    />
                  </div>
                  {updateError && (
                    <p className="text-xs text-red-600">{updateError}</p>
                  )}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleEditSave}
                      disabled={isUpdating}
                      className="flex items-center gap-1.5 rounded-lg bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy/90 disabled:opacity-50 transition-colors"
                    >
                      <Save size={14} />
                      {isUpdating ? "Menyimpan..." : "Simpan"}
                    </button>
                    <button
                      type="button"
                      onClick={handleEditCancel}
                      className="flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-medium text-ink hover:bg-surface transition-colors"
                    >
                      <X size={14} />
                      Batal
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h2 className="text-xl font-bold font-display text-navy">
                      {profile.name ?? "Petugas"}
                    </h2>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full",
                        roleColor
                      )}
                    >
                      <Shield size={12} />
                      {roleLabel}
                    </span>
                    {profile.isVerified && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-green-100 text-green-700">
                        <BadgeCheck size={12} />
                        Terverifikasi
                      </span>
                    )}
                  </div>

                  {profile.nip && (
                    <p className="text-sm text-muted mb-3">
                      NIP: <span className="font-mono font-semibold">{profile.nip}</span>
                    </p>
                  )}

                  <div className="space-y-2">
                    {profile.email && (
                      <div className="flex items-center gap-2 text-sm text-ink">
                        <Mail size={16} className="text-muted shrink-0" />
                        <span>{profile.email}</span>
                      </div>
                    )}
                    {profile.phone && (
                      <div className="flex items-center gap-2 text-sm text-ink">
                        <Phone size={16} className="text-muted shrink-0" />
                        <span>{profile.phone}</span>
                      </div>
                    )}
                    {profile.agency && (
                      <div className="flex items-center gap-2 text-sm text-ink">
                        <Building2 size={16} className="text-muted shrink-0" />
                        <span>{profile.agency.name}</span>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleEditStart}
                    className="mt-4 flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-ink hover:bg-surface transition-colors"
                  >
                    <Edit2 size={14} />
                    Edit Profil
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Activity Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="card-base p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                <FileText size={20} className="text-blue" />
              </div>
              <div>
                <p className="text-2xl font-bold font-display text-navy">
                  {profile.stats.totalReports}
                </p>
                <p className="text-xs text-muted">Laporan Ditangani</p>
              </div>
            </div>
          </div>

          <div className="card-base p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50">
                <MessageSquare size={20} className="text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold font-display text-navy">
                  {profile.stats.totalComments}
                </p>
                <p className="text-xs text-muted">Komentar</p>
              </div>
            </div>
          </div>
        </div>

        {/* Agency Info Card */}
        {profile.agency && (
          <div className="card-base p-5 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Building2 size={18} className="text-blue" />
              <h3 className="text-sm font-bold font-display text-navy">
                Informasi Instansi
              </h3>
            </div>
            <div className="space-y-2">
              <div className="flex items-start gap-3">
                <span className="text-xs text-muted w-24 shrink-0 pt-0.5">Nama</span>
                <span className="text-sm text-ink font-medium">{profile.agency.name}</span>
              </div>
              {profile.agency.address && (
                <div className="flex items-start gap-3">
                  <span className="text-xs text-muted w-24 shrink-0 pt-0.5">Alamat</span>
                  <span className="text-sm text-ink">{profile.agency.address}</span>
                </div>
              )}
              {profile.agency.phone && (
                <div className="flex items-start gap-3">
                  <span className="text-xs text-muted w-24 shrink-0 pt-0.5">Telepon</span>
                  <span className="text-sm text-ink">{profile.agency.phone}</span>
                </div>
              )}
              {profile.agency.email && (
                <div className="flex items-start gap-3">
                  <span className="text-xs text-muted w-24 shrink-0 pt-0.5">Email</span>
                  <span className="text-sm text-ink">{profile.agency.email}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Logout */}
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
