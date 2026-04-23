// ── app/gov/settings/page.tsx ──
"use client";

import { useState, useEffect } from "react";
import { Bell, Lock, User, Building2, Save } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";

export default function GovSettingsPage() {
  const [activeTab, setActiveTab] = useState<"profile" | "agency" | "notifications" | "security">("profile");
  const { profile, isLoading, isUpdating, updateProfile } = useProfile();

  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    phone: "",
    position: "",
  });

  const [agencyData, setAgencyData] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
  });

  useEffect(() => {
    if (profile) {
      setProfileData({
        name: profile.name || "",
        email: profile.email || "",
        phone: profile.phone || "",
        position: profile.nip || "Petugas",
      });
      if (profile.agency) {
        setAgencyData({
          name: profile.agency.name || "",
          address: profile.agency.address || "",
          phone: profile.agency.phone || "",
          email: profile.agency.email || "",
        });
      }
    }
  }, [profile]);

  const [notificationSettings, setNotificationSettings] = useState({
    emailNewReport: true,
    emailStatusChange: true,
    emailHighPriority: true,
    whatsappNewReport: false,
    whatsappStatusChange: false,
    whatsappHighPriority: true,
  });

  const handleSave = async () => {
    try {
      await updateProfile({
        name: profileData.name,
        phone: profileData.phone,
      });
      alert("Pengaturan berhasil disimpan");
    } catch (err) {
      alert("Gagal menyimpan pengaturan");
    }
  };

  if (isLoading) return <div className="p-8 text-center">Memuat pengaturan...</div>;

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-display text-navy mb-2">
          Pengaturan
        </h1>
        <p className="text-sm text-muted">
          Kelola profil, notifikasi, dan pengaturan akun Anda
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Tabs */}
        <div className="lg:col-span-1">
          <div className="rounded-2xl bg-white shadow-sm border border-border p-2">
            <button
              onClick={() => setActiveTab("profile")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                activeTab === "profile"
                  ? "bg-blue text-white"
                  : "text-ink hover:bg-surface"
              }`}
            >
              <User size={18} />
              <span className="text-sm font-medium">Profil</span>
            </button>
            <button
              onClick={() => setActiveTab("agency")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                activeTab === "agency"
                  ? "bg-blue text-white"
                  : "text-ink hover:bg-surface"
              }`}
            >
              <Building2 size={18} />
              <span className="text-sm font-medium">Instansi</span>
            </button>
            <button
              onClick={() => setActiveTab("notifications")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                activeTab === "notifications"
                  ? "bg-blue text-white"
                  : "text-ink hover:bg-surface"
              }`}
            >
              <Bell size={18} />
              <span className="text-sm font-medium">Notifikasi</span>
            </button>
            <button
              onClick={() => setActiveTab("security")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                activeTab === "security"
                  ? "bg-blue text-white"
                  : "text-ink hover:bg-surface"
              }`}
            >
              <Lock size={18} />
              <span className="text-sm font-medium">Keamanan</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3">
          <div className="rounded-2xl bg-white shadow-sm border border-border p-6">
            {/* Profile Tab */}
            {activeTab === "profile" && (
              <div>
                <h2 className="text-lg font-semibold font-display text-navy mb-4">
                  Informasi Profil
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-ink mb-1">
                      Nama Lengkap
                    </label>
                    <input
                      type="text"
                      value={profileData.name}
                      onChange={(e) =>
                        setProfileData({ ...profileData, name: e.target.value })
                      }
                      className="w-full rounded-lg border border-border bg-white px-4 py-2 text-sm text-ink focus:border-blue focus:outline-none focus:ring-2 focus:ring-blue/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={profileData.email}
                      onChange={(e) =>
                        setProfileData({ ...profileData, email: e.target.value })
                      }
                      className="w-full rounded-lg border border-border bg-white px-4 py-2 text-sm text-ink focus:border-blue focus:outline-none focus:ring-2 focus:ring-blue/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink mb-1">
                      Nomor Telepon
                    </label>
                    <input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) =>
                        setProfileData({ ...profileData, phone: e.target.value })
                      }
                      className="w-full rounded-lg border border-border bg-white px-4 py-2 text-sm text-ink focus:border-blue focus:outline-none focus:ring-2 focus:ring-blue/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink mb-1">
                      Jabatan
                    </label>
                    <input
                      type="text"
                      value={profileData.position}
                      onChange={(e) =>
                        setProfileData({ ...profileData, position: e.target.value })
                      }
                      className="w-full rounded-lg border border-border bg-white px-4 py-2 text-sm text-ink focus:border-blue focus:outline-none focus:ring-2 focus:ring-blue/20"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Agency Tab */}
            {activeTab === "agency" && (
              <div>
                <h2 className="text-lg font-semibold font-display text-navy mb-4">
                  Informasi Instansi
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-ink mb-1">
                      Nama Instansi
                    </label>
                    <input
                      type="text"
                      value={agencyData.name}
                      onChange={(e) =>
                        setAgencyData({ ...agencyData, name: e.target.value })
                      }
                      className="w-full rounded-lg border border-border bg-white px-4 py-2 text-sm text-ink focus:border-blue focus:outline-none focus:ring-2 focus:ring-blue/20"
                      disabled
                    />
                    <p className="text-xs text-muted mt-1">
                      Hubungi administrator untuk mengubah nama instansi
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink mb-1">
                      Alamat
                    </label>
                    <textarea
                      value={agencyData.address}
                      onChange={(e) =>
                        setAgencyData({ ...agencyData, address: e.target.value })
                      }
                      rows={3}
                      className="w-full rounded-lg border border-border bg-white px-4 py-2 text-sm text-ink focus:border-blue focus:outline-none focus:ring-2 focus:ring-blue/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink mb-1">
                      Nomor Telepon
                    </label>
                    <input
                      type="tel"
                      value={agencyData.phone}
                      onChange={(e) =>
                        setAgencyData({ ...agencyData, phone: e.target.value })
                      }
                      className="w-full rounded-lg border border-border bg-white px-4 py-2 text-sm text-ink focus:border-blue focus:outline-none focus:ring-2 focus:ring-blue/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={agencyData.email}
                      onChange={(e) =>
                        setAgencyData({ ...agencyData, email: e.target.value })
                      }
                      className="w-full rounded-lg border border-border bg-white px-4 py-2 text-sm text-ink focus:border-blue focus:outline-none focus:ring-2 focus:ring-blue/20"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === "notifications" && (
              <div>
                <h2 className="text-lg font-semibold font-display text-navy mb-4">
                  Preferensi Notifikasi
                </h2>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-semibold text-ink mb-3">
                      Notifikasi Email
                    </h3>
                    <div className="space-y-3">
                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={notificationSettings.emailNewReport}
                          onChange={(e) =>
                            setNotificationSettings({
                              ...notificationSettings,
                              emailNewReport: e.target.checked,
                            })
                          }
                          className="w-4 h-4 rounded border-border text-blue focus:ring-2 focus:ring-blue/20"
                        />
                        <span className="text-sm text-ink">Laporan baru masuk</span>
                      </label>
                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={notificationSettings.emailStatusChange}
                          onChange={(e) =>
                            setNotificationSettings({
                              ...notificationSettings,
                              emailStatusChange: e.target.checked,
                            })
                          }
                          className="w-4 h-4 rounded border-border text-blue focus:ring-2 focus:ring-blue/20"
                        />
                        <span className="text-sm text-ink">Perubahan status laporan</span>
                      </label>
                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={notificationSettings.emailHighPriority}
                          onChange={(e) =>
                            setNotificationSettings({
                              ...notificationSettings,
                              emailHighPriority: e.target.checked,
                            })
                          }
                          className="w-4 h-4 rounded border-border text-blue focus:ring-2 focus:ring-blue/20"
                        />
                        <span className="text-sm text-ink">Laporan prioritas tinggi</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-ink mb-3">
                      Notifikasi WhatsApp
                    </h3>
                    <div className="space-y-3">
                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={notificationSettings.whatsappNewReport}
                          onChange={(e) =>
                            setNotificationSettings({
                              ...notificationSettings,
                              whatsappNewReport: e.target.checked,
                            })
                          }
                          className="w-4 h-4 rounded border-border text-blue focus:ring-2 focus:ring-blue/20"
                        />
                        <span className="text-sm text-ink">Laporan baru masuk</span>
                      </label>
                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={notificationSettings.whatsappStatusChange}
                          onChange={(e) =>
                            setNotificationSettings({
                              ...notificationSettings,
                              whatsappStatusChange: e.target.checked,
                            })
                          }
                          className="w-4 h-4 rounded border-border text-blue focus:ring-2 focus:ring-blue/20"
                        />
                        <span className="text-sm text-ink">Perubahan status laporan</span>
                      </label>
                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={notificationSettings.whatsappHighPriority}
                          onChange={(e) =>
                            setNotificationSettings({
                              ...notificationSettings,
                              whatsappHighPriority: e.target.checked,
                            })
                          }
                          className="w-4 h-4 rounded border-border text-blue focus:ring-2 focus:ring-blue/20"
                        />
                        <span className="text-sm text-ink">Laporan prioritas tinggi</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === "security" && (
              <div>
                <h2 className="text-lg font-semibold font-display text-navy mb-4">
                  Keamanan Akun
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-ink mb-1">
                      Password Lama
                    </label>
                    <input
                      type="password"
                      placeholder="Masukkan password lama"
                      className="w-full rounded-lg border border-border bg-white px-4 py-2 text-sm text-ink focus:border-blue focus:outline-none focus:ring-2 focus:ring-blue/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink mb-1">
                      Password Baru
                    </label>
                    <input
                      type="password"
                      placeholder="Masukkan password baru"
                      className="w-full rounded-lg border border-border bg-white px-4 py-2 text-sm text-ink focus:border-blue focus:outline-none focus:ring-2 focus:ring-blue/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink mb-1">
                      Konfirmasi Password Baru
                    </label>
                    <input
                      type="password"
                      placeholder="Konfirmasi password baru"
                      className="w-full rounded-lg border border-border bg-white px-4 py-2 text-sm text-ink focus:border-blue focus:outline-none focus:ring-2 focus:ring-blue/20"
                    />
                  </div>
                  <div className="pt-2">
                    <button
                      type="button"
                      className="rounded-lg bg-blue px-4 py-2 text-sm font-medium text-white hover:bg-blue-dark transition-colors"
                    >
                      Ubah Password
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Save Button */}
            {activeTab !== "security" && (
              <div className="mt-6 pt-6 border-t border-border">
                <button
                  onClick={handleSave}
                  disabled={isUpdating}
                  className="flex items-center gap-2 rounded-lg bg-blue px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save size={16} />
                  {isUpdating ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
