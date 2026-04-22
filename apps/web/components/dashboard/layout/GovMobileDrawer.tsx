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
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

type NavItem = {
  href: string;
  icon: typeof LayoutDashboard;
  label: string;
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

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 lg:hidden",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={onClose}
      />

      {/* Drawer */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-screen w-64 flex-col bg-navy transition-transform duration-300 lg:hidden",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b border-white/10 px-6">
          <div className="flex items-center gap-2">
            <span className="font-display text-xl font-bold text-white">
              🏛 Laporin
            </span>
            <span className="rounded-full bg-blue-light px-2 py-0.5 text-xs font-semibold text-blue">
              GOV
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition-colors"
            aria-label="Tutup menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <div className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/gov"
                  ? pathname === "/gov"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
                    "min-h-[44px]",
                    isActive
                      ? "border-l-2 border-white bg-white/10 text-white"
                      : "text-white/70 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="border-t border-white/10 p-4">
          <div className="space-y-1">
            <p className="text-xs text-white/60">
              {user?.agencyName || "Dinas PU Bina Marga"}
            </p>
            <p className="text-sm font-medium text-white">
              {user?.name || "Petugas"}
            </p>
            <span className="inline-block rounded-full bg-blue-light px-2 py-0.5 text-xs font-semibold text-blue">
              {user?.role === "admin" ? "Admin" : "Officer"}
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}
