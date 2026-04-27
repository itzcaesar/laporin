// ── components/dashboard/layout/CitizenTopbar.tsx ──
"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Search, Bell, ChevronDown, Home, Map, FileText, Bookmark, HelpCircle, MessageSquare, Trophy, Check, Filter } from "lucide-react";
import { useScrolled } from "@/hooks/useScrolled";
import { useAuth } from "@/hooks/useAuth";
import { cn, formatRelativeTime } from "@/lib/utils";

// Desktop navigation items
const NAV_ITEMS = [
  { href: "/citizen", icon: Home, label: "Beranda" },
  { href: "/citizen/map", icon: Map, label: "Peta" },
  { href: "/citizen/my-reports", icon: FileText, label: "Laporan Saya" },
  { href: "/citizen/achievements", icon: Trophy, label: "Pencapaian" },
  { href: "/citizen/bookmarks", icon: Bookmark, label: "Bookmark" },
  { href: "/citizen/faq", icon: HelpCircle, label: "FAQ" },
  { href: "/citizen/forum", icon: MessageSquare, label: "Forum" },
];

import { useNotifications } from "@/hooks/useNotifications";
import { SearchSuggestions } from "@/components/dashboard/shared/SearchSuggestions";


export function CitizenTopbar() {
  const pathname = usePathname();
  const router = useRouter();
  const isScrolled = useScrolled(10);
  const { user, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");
  
  const { notifications, unreadCount, markAllRead } = useNotifications();

  const FILTER_OPTIONS = [
    { label: "Semua", value: "all" },
    { label: "Baru", value: "baru" },
    { label: "Diverifikasi", value: "diverifikasi" },
    { label: "Diproses", value: "diproses" },
    { label: "Selesai", value: "selesai" },
    { label: "Terverifikasi", value: "terverifikasi" },
  ];

  const handleNotificationClick = (notification: any) => {
    // API logic to mark individual notification as read is handled in hook or backend when viewed
    setIsNotificationOpen(false);
    if (notification.reportId) {
      router.push(`/citizen/reports/${notification.reportId}`);
    }
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-40 h-16 transition-all duration-200",
        isScrolled ? "bg-white shadow-sm border-b border-border" : "bg-white border-b border-transparent"
      )}
    >
      <div className="flex h-full items-center justify-between px-4 sm:px-6">
        {/* Left: Logo + Desktop Nav */}
        <div className="flex items-center gap-6 flex-1">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-md shadow-sm">
              <Image
                src="/icons/icon-192.png"
                alt="Laporin"
                width={32}
                height={32}
                className="scale-[1.15] object-cover"
              />
            </div>
            <span className="font-display text-lg font-bold text-navy">
              Laporin
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    "min-h-[40px]",
                    isActive
                      ? "bg-navy text-white"
                      : "text-muted hover:bg-surface hover:text-ink"
                  )}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Search (desktop only) */}
          <div className="hidden xl:block flex-1 max-w-md ml-4">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                size={18}
              />
              <input
                type="search"
                placeholder="Cari laporan..."
                className="w-full rounded-xl border border-border bg-surface pl-10 pr-4 py-2 text-sm text-ink placeholder:text-muted focus:border-blue focus:outline-none focus:ring-2 focus:ring-blue/20 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Right: Notifications + Avatar */}
        <div className="flex items-center gap-3">
          {/* Filter button - Mobile only, only on homepage */}
          {pathname === "/citizen" && (
            <div 
              className="relative md:hidden"
              onMouseEnter={() => setIsFilterOpen(true)}
              onMouseLeave={() => setIsFilterOpen(false)}
            >
              <button
                type="button"
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={cn(
                  "flex items-center gap-1.5 h-10 px-3 rounded-lg transition-colors min-h-[44px]",
                  activeFilter !== "all"
                    ? "bg-navy text-white"
                    : "text-muted hover:bg-surface hover:text-ink"
                )}
                aria-label="Filter"
              >
                <Filter size={20} />
                {activeFilter !== "all" && (
                  <span className="text-xs font-medium">
                    {FILTER_OPTIONS.find(f => f.value === activeFilter)?.label}
                  </span>
                )}
              </button>

              {/* Filter Dropdown */}
              {isFilterOpen && (
                <>
                  {/* Backdrop - only on mobile */}
                  <div
                    className="fixed inset-0 z-40 md:hidden"
                    onClick={() => setIsFilterOpen(false)}
                  />

                  {/* Invisible bridge */}
                  <div className="absolute right-0 top-full h-2 w-full" />

                  {/* Dropdown */}
                  <div 
                    className="absolute right-0 top-full mt-0.5 w-48 rounded-xl border border-border bg-white shadow-xl z-50"
                    onMouseEnter={() => setIsFilterOpen(true)}
                    onMouseLeave={() => setIsFilterOpen(false)}
                  >
                    <div className="p-2">
                      {FILTER_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => {
                            setActiveFilter(option.value);
                            setIsFilterOpen(false);
                            // Trigger filter change via URL or state management
                            const event = new CustomEvent('filterChange', { detail: option.value });
                            window.dispatchEvent(event);
                          }}
                          className={cn(
                            "w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors",
                            activeFilter === option.value
                              ? "bg-navy text-white font-medium"
                              : "text-ink hover:bg-surface"
                          )}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Notification bell with dropdown */}
          <div 
            className="relative"
            onMouseEnter={() => setIsNotificationOpen(true)}
            onMouseLeave={() => setIsNotificationOpen(false)}
          >
            <button
              type="button"
              onClick={() => setIsNotificationOpen(!isNotificationOpen)}
              className="relative flex items-center gap-1.5 h-10 px-2.5 rounded-lg text-muted hover:bg-surface hover:text-ink transition-colors min-h-[44px]"
              aria-label="Notifikasi"
            >
              <div className="relative">
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </div>
              <ChevronDown 
                size={14} 
                className={cn(
                  "hidden md:block text-muted transition-transform",
                  isNotificationOpen && "rotate-180"
                )}
              />
            </button>

            {/* Notification Dropdown */}
            {isNotificationOpen && (
              <>
                {/* Backdrop - only on mobile */}
                <div
                  className="fixed inset-0 z-40 md:hidden"
                  onClick={() => setIsNotificationOpen(false)}
                />

                {/* Invisible bridge to prevent dropdown from closing */}
                <div className="absolute right-0 top-full h-2 w-full" />

                {/* Dropdown */}
                <div 
                  className="absolute right-0 top-full mt-0.5 w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-white shadow-xl z-50 max-h-[65vh] overflow-hidden flex flex-col"
                  onMouseEnter={() => setIsNotificationOpen(true)}
                  onMouseLeave={() => setIsNotificationOpen(false)}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between p-3 border-b border-border">
                    <div>
                      <h3 className="text-sm font-semibold font-display text-navy">
                        Notifikasi
                      </h3>
                      {unreadCount > 0 && (
                        <p className="text-xs text-muted mt-0.5">
                          {unreadCount} belum dibaca
                        </p>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          markAllRead();
                        }}
                        className="flex items-center gap-1 text-xs font-medium text-blue hover:text-blue/80 transition-colors"
                      >
                        <Check size={14} />
                      </button>
                    )}
                  </div>

                  {/* Notification List */}
                  <div className="overflow-y-auto flex-1">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center">
                        <Bell size={28} className="mx-auto text-muted mb-2" />
                        <p className="text-sm font-medium text-ink">
                          Belum ada notifikasi
                        </p>
                        <p className="text-xs text-muted mt-1">
                          Notifikasi akan muncul di sini
                        </p>
                      </div>
                    ) : (
                      <div className="divide-y divide-border">
                        {notifications.map((notification) => (
                          <button
                            key={notification.id}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleNotificationClick(notification);
                            }}
                            className={cn(
                              "w-full text-left p-3 transition-colors hover:bg-surface",
                              !notification.isRead && "bg-blue-light/20"
                            )}
                          >
                            <div className="flex items-start gap-2">
                              {!notification.isRead && (
                                <div className="mt-1.5 h-2 w-2 rounded-full bg-blue shrink-0" />
                              )}
                              <div className="flex-1 min-w-0">
                                <h4
                                  className={cn(
                                    "text-xs font-semibold font-display mb-0.5",
                                    notification.isRead ? "text-ink" : "text-navy"
                                  )}
                                >
                                  {notification.title}
                                </h4>
                                <p className="text-[11px] text-muted leading-relaxed mb-1 line-clamp-2">
                                  {notification.body}
                                </p>
                                <p className="text-[10px] text-muted">
                                  {formatRelativeTime(notification.createdAt)}
                                </p>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  {notifications.length > 0 && (
                    <div className="p-2.5 border-t border-border">
                      <Link
                        href="/citizen/notifications"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsNotificationOpen(false);
                        }}
                        className="block text-center text-xs font-medium text-blue hover:text-blue/80 transition-colors py-1"
                      >
                        Lihat Semua Notifikasi
                      </Link>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Avatar dropdown */}
          <div 
            className="relative"
            onMouseEnter={() => setIsDropdownOpen(true)}
            onMouseLeave={() => setIsDropdownOpen(false)}
          >
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 hover:bg-surface transition-colors min-h-[44px]"
              aria-label="Menu pengguna"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-navy text-sm font-semibold text-white">
                {user?.name?.charAt(0).toUpperCase() || "U"}
              </div>
              <ChevronDown
                size={14}
                className={cn(
                  "text-muted transition-transform hidden sm:block",
                  isDropdownOpen && "rotate-180"
                )}
              />
            </button>

            {/* Dropdown menu */}
            {isDropdownOpen && (
              <>
                {/* Backdrop - only on mobile */}
                <div
                  className="fixed inset-0 z-40 md:hidden"
                  onClick={() => setIsDropdownOpen(false)}
                />

                {/* Invisible bridge to prevent dropdown from closing */}
                <div className="absolute right-0 top-full h-2 w-full" />

                {/* Menu */}
                <div 
                  className="absolute right-0 top-full mt-0.5 w-48 rounded-xl border border-border bg-white shadow-lg z-50"
                  onMouseEnter={() => setIsDropdownOpen(true)}
                  onMouseLeave={() => setIsDropdownOpen(false)}
                >
                  <div className="p-3 border-b border-border">
                    <p className="text-sm font-semibold text-ink truncate">
                      {user?.name || "Pengguna"}
                    </p>
                    <p className="text-xs text-muted truncate">
                      {user?.email}
                    </p>
                  </div>
                  <div className="py-1">
                    <Link
                      href="/citizen/profile"
                      className="block px-4 py-2.5 text-sm text-ink hover:bg-surface transition-colors"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      Profil Saya
                    </Link>
                    <Link
                      href="/citizen/my-reports"
                      className="block px-4 py-2.5 text-sm text-ink hover:bg-surface transition-colors"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      Laporan Saya
                    </Link>
                    <Link
                      href="/citizen/bookmarks"
                      className="block px-4 py-2.5 text-sm text-ink hover:bg-surface transition-colors"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      Bookmark
                    </Link>
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
