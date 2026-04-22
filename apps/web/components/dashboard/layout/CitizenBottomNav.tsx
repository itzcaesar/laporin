// ── components/dashboard/layout/CitizenBottomNav.tsx ──
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Map, Plus, MessageSquare, User } from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  icon: typeof Home;
  label: string;
  isFAB?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/citizen", icon: Home, label: "Beranda" },
  { href: "/citizen/map", icon: Map, label: "Peta" },
  { href: "/citizen/reports/new", icon: Plus, label: "Buat", isFAB: true },
  { href: "/citizen/forum", icon: MessageSquare, label: "Forum" },
  { href: "/citizen/profile", icon: User, label: "Profil" },
];

export function CitizenBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-white lg:hidden">
      <div className="flex items-center justify-around h-16 px-2">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          // Center FAB button
          if (item.isFAB) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center -mt-8"
                aria-label={item.label}
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-navy text-white shadow-lg hover:bg-navy/90 transition-colors">
                  <Icon size={28} />
                </div>
              </Link>
            );
          }

          // Regular nav items
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-1 rounded-lg px-3 py-2 transition-colors",
                isActive
                  ? "text-blue"
                  : "text-muted hover:text-ink"
              )}
              aria-label={item.label}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
