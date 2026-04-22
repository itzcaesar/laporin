// ── components/dashboard/layout/GovTopbar.tsx ──
"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Menu, Bell, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

type GovTopbarProps = {
  onMenuClick: () => void;
};

const BREADCRUMB_LABELS: Record<string, string> = {
  "/gov": "Dasbor",
  "/gov/reports": "Laporan",
  "/gov/map": "Peta",
  "/gov/analytics": "Analitik",
  "/gov/officers": "Petugas",
  "/gov/audit": "Log Audit",
  "/gov/settings": "Pengaturan",
};

export function GovTopbar({ onMenuClick }: GovTopbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Get breadcrumb from pathname
  const breadcrumb = BREADCRUMB_LABELS[pathname] || "Dasbor";

  // Mock unread notifications count
  const unreadCount = 3;

  return (
    <header className="sticky top-0 z-40 h-16 border-b border-border bg-white shadow-sm">
      <div className="flex h-full items-center justify-between px-4 sm:px-6">
        {/* Left: Menu button (mobile) + Breadcrumb (desktop) */}
        <div className="flex items-center gap-4">
          {/* Mobile menu button */}
          <button
            type="button"
            onClick={onMenuClick}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-muted hover:bg-surface hover:text-ink transition-colors lg:hidden min-h-[44px] min-w-[44px]"
            aria-label="Buka menu"
          >
            <Menu size={20} />
          </button>

          {/* Desktop breadcrumb */}
          <div className="hidden lg:block">
            <h1 className="text-lg font-semibold font-display text-navy">
              {breadcrumb}
            </h1>
          </div>
        </div>

        {/* Right: Notification + Avatar */}
        <div className="flex items-center gap-3">
          {/* Notification bell */}
          <button
            type="button"
            onClick={() => router.push("/gov/notifications")}
            className="relative flex h-10 w-10 items-center justify-center rounded-lg text-muted hover:bg-surface hover:text-ink transition-colors min-h-[44px] min-w-[44px]"
            aria-label="Notifikasi"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {/* Avatar dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-surface transition-colors min-h-[44px]"
              aria-label="Menu pengguna"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-navy text-sm font-semibold text-white">
                {user?.name?.charAt(0).toUpperCase() || "U"}
              </div>
              <ChevronDown
                size={14}
                className={cn(
                  "hidden text-muted transition-transform sm:block",
                  isDropdownOpen && "rotate-180"
                )}
              />
            </button>

            {/* Dropdown menu */}
            {isDropdownOpen && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsDropdownOpen(false)}
                />

                {/* Menu */}
                <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-border bg-white shadow-lg z-50">
                  <div className="p-3 border-b border-border">
                    <p className="text-sm font-semibold text-ink truncate">
                      {user?.name || "Petugas"}
                    </p>
                    <p className="text-xs text-muted truncate">
                      {user?.email}
                    </p>
                  </div>
                  <div className="py-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsDropdownOpen(false);
                        router.push("/gov/profile");
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm text-ink hover:bg-surface transition-colors"
                    >
                      Profil
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsDropdownOpen(false);
                        router.push("/gov/settings");
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm text-ink hover:bg-surface transition-colors"
                    >
                      Pengaturan
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsDropdownOpen(false);
                        logout();
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      Keluar
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
