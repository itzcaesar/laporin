// ── components/dashboard/layout/GovMobileDrawer.tsx ──
"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  Map,
  BarChart2,
  Users,
  FileText,
  Settings,
  HelpCircle,
  MessageSquare,
  MessagesSquare,
  Sparkles,
  Bell,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";

type NavItem = {
  href: string;
  icon: typeof LayoutDashboard;
  label: string;
  badge?: number;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/gov", icon: LayoutDashboard, label: "Dasbor" },
  { href: "/gov/reports", icon: ClipboardList, label: "Laporan" },
  { href: "/gov/map", icon: Map, label: "Peta" },
  { href: "/gov/analytics", icon: BarChart2, label: "Analitik" },
  { href: "/gov/ai-assistant", icon: Sparkles, label: "AI Assistant" },
  { href: "/gov/officers", icon: Users, label: "Petugas" },
  { href: "/gov/surveys", icon: MessageSquare, label: "Survei" },
  { href: "/gov/faq", icon: HelpCircle, label: "FAQ" },
  { href: "/gov/forum", icon: MessagesSquare, label: "Forum" },
  { href: "/gov/audit", icon: FileText, label: "Log Audit" },
  { href: "/gov/settings", icon: Settings, label: "Pengaturan" },
];

type GovMobileDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function GovMobileDrawer({ isOpen, onClose }: GovMobileDrawerProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const { unreadCount } = useNotifications();

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Auto-close on route change
  useEffect(() => {
    onClose();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 lg:hidden",
          isOpen ? "opacity-100 pointer-events-auto" : "pointer-events-none opacity-0"
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-screen w-72 flex flex-col bg-navy transition-transform duration-300 ease-out lg:hidden shadow-2xl",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
        aria-label="Navigasi"
      >
        {/* Header */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 px-5">
          <div className="flex items-center gap-2">
            <span className="font-display text-xl font-bold text-white">
              Laporin
            </span>
            <span className="rounded-full bg-blue-light px-2 py-0.5 text-xs font-semibold text-blue">
              GOV
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-white/70 hover:bg-white/10 hover:text-white transition-colors"
            aria-label="Tutup menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* User Info Strip */}
        <div className="shrink-0 px-5 py-3 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-light text-blue font-bold text-sm shrink-0">
              {user?.name?.charAt(0).toUpperCase() || "P"}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                {user?.name || "Petugas"}
              </p>
              <p className="text-xs text-white/50 truncate">
                {user?.agencyName || "Dinas PU Bina Marga"}
              </p>
            </div>
            <span className="ml-auto shrink-0 rounded-full bg-blue-light px-2 py-0.5 text-[10px] font-bold text-blue">
              {user?.role === "admin" ? "Admin" : "Officer"}
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-3" aria-label="Menu utama">
          <div className="space-y-0.5">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/gov"
                  ? pathname === "/gov"
                  : pathname.startsWith(item.href);
              const badge = item.href === "/gov/notifications" ? unreadCount : undefined;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-150",
                    "min-h-[48px] relative",
                    isActive
                      ? "bg-white/15 text-white border-l-2 border-blue-light"
                      : "text-white/70 hover:bg-white/8 hover:text-white active:bg-white/20"
                  )}
                >
                  <Icon size={18} className="shrink-0" />
                  <span className="flex-1">{item.label}</span>
                  {badge && badge > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                      {badge > 9 ? "9+" : badge}
                    </span>
                  )}
                  {isActive && (
                    <div className="absolute right-3 h-1.5 w-1.5 rounded-full bg-blue-light" />
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Notification shortcut */}
        <div className="shrink-0 border-t border-white/10 p-3">
          <Link
            href="/gov/notifications"
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-white/70 hover:bg-white/8 hover:text-white transition-colors min-h-[48px]"
          >
            <Bell size={18} className="shrink-0" />
            <span className="flex-1">Notifikasi</span>
            {unreadCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>
        </div>
      </aside>
    </>
  );
}
