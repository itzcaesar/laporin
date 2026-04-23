// ── components/dashboard/layout/GovBottomNav.tsx ──
// Mobile-only bottom navigation bar for the gov dashboard.
// Shows the 5 most-used pages; full nav is in the drawer.
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  Map,
  Bell,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/hooks/useNotifications";

type BottomNavItem = {
  href: string;
  icon: typeof LayoutDashboard;
  label: string;
};

const BOTTOM_ITEMS: BottomNavItem[] = [
  { href: "/gov", icon: LayoutDashboard, label: "Dasbor" },
  { href: "/gov/reports", icon: ClipboardList, label: "Laporan" },
  { href: "/gov/map", icon: Map, label: "Peta" },
  { href: "/gov/notifications", icon: Bell, label: "Notif" },
];

type GovBottomNavProps = {
  onMenuClick: () => void;
};

export function GovBottomNav({ onMenuClick }: GovBottomNavProps) {
  const pathname = usePathname();
  const { unreadCount } = useNotifications();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-white lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Navigasi bawah"
    >
      <div className="flex h-16 items-stretch">
        {BOTTOM_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/gov"
              ? pathname === "/gov"
              : pathname.startsWith(item.href);
          const badge =
            item.href === "/gov/notifications" && unreadCount > 0
              ? unreadCount
              : undefined;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex flex-1 flex-col items-center justify-center gap-1 text-[10px] font-semibold transition-all duration-150",
                isActive ? "text-blue" : "text-muted hover:text-ink"
              )}
            >
              {/* Active indicator */}
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full bg-blue" />
              )}

              <div className="relative">
                <Icon
                  size={20}
                  strokeWidth={isActive ? 2.5 : 1.8}
                  className={cn(
                    "transition-transform duration-150",
                    isActive && "scale-110"
                  )}
                />
                {badge && (
                  <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-0.5 text-[9px] font-bold text-white">
                    {badge > 9 ? "9+" : badge}
                  </span>
                )}
              </div>
              <span>{item.label}</span>
            </Link>
          );
        })}

        {/* More button → opens drawer */}
        <button
          type="button"
          onClick={onMenuClick}
          className="relative flex flex-1 flex-col items-center justify-center gap-1 text-[10px] font-semibold text-muted hover:text-ink transition-colors"
          aria-label="Menu lainnya"
        >
          <Menu size={20} strokeWidth={1.8} />
          <span>Lainnya</span>
        </button>
      </div>
    </nav>
  );
}
