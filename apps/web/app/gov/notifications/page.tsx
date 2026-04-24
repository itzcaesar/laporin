// ── app/gov/notifications/page.tsx ──
// Government notifications page
"use client";

import { useNotifications } from "@/hooks/useNotifications";
import { Check, Bell, Info } from "lucide-react";
import { cn, formatRelativeTime } from "@/lib/utils";
import EmptyState from "@/components/dashboard/shared/EmptyState";
import LoadingSkeleton from "@/components/dashboard/shared/LoadingSkeleton";
import { useRouter } from "next/navigation";

export default function GovNotificationsPage() {
  const router = useRouter();
  const { notifications, isLoading, unreadCount, markAllRead } =
    useNotifications(1);

  const handleMarkRead = async (notificationId: string, reportId: string | null) => {
    // Navigate to report detail if available
    if (reportId) {
      router.push(`/gov/reports/${reportId}`);
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold font-display text-navy flex items-center gap-2">
              <Bell className="text-blue" size={24} />
              Notifikasi Petugas
            </h1>
            <p className="text-sm text-muted mt-1">
              Pantau pembaruan laporan dan peringatan SLA di wilayah Anda.
            </p>
          </div>
          
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllRead}
              className="flex items-center justify-center gap-2 text-sm font-medium bg-white border border-border px-4 py-2 rounded-lg hover:bg-surface hover:text-navy transition-all shadow-sm min-h-[40px]"
            >
              <Check size={16} />
              Tandai semua dibaca
            </button>
          )}
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6 flex items-start gap-3">
          <Info className="text-blue shrink-0 mt-0.5" size={18} />
          <p className="text-sm text-blue-800">
            <strong>Tips:</strong> Klik notifikasi untuk langsung menuju ke detail laporan yang relevan.
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-24 w-full rounded-xl bg-surface animate-pulse" />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && notifications.length === 0 && (
          <div className="bg-white rounded-2xl border border-border p-12 text-center shadow-sm">
            <div className="h-16 w-16 bg-surface rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="text-muted" size={32} />
            </div>
            <h3 className="text-lg font-semibold text-navy mb-2">Belum ada notifikasi</h3>
            <p className="text-muted max-w-sm mx-auto">
              Anda akan menerima notifikasi di sini ketika ada laporan baru ditugaskan atau ada peringatan SLA.
            </p>
          </div>
        )}

        {/* Notification List */}
        {!isLoading && notifications.length > 0 && (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <button
                key={notification.id}
                type="button"
                onClick={() =>
                  handleMarkRead(notification.id, notification.reportId)
                }
                className={cn(
                  "w-full text-left rounded-xl border p-5 transition-all duration-200 group relative",
                  "hover:shadow-md hover:border-blue/30 hover:bg-surface/50",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue",
                  notification.isRead
                    ? "bg-white border-border"
                    : "bg-white border-blue/20 ring-1 ring-blue/5 shadow-sm"
                )}
              >
                <div className="flex items-start gap-4">
                  {/* Status Indicator */}
                  <div className={cn(
                    "mt-1.5 h-2.5 w-2.5 rounded-full shrink-0 transition-transform group-hover:scale-125",
                    notification.isRead ? "bg-muted" : "bg-blue shadow-[0_0_8px_rgba(37,99,235,0.4)]"
                  )} />

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h3
                        className={cn(
                          "text-base font-semibold font-display truncate",
                          notification.isRead ? "text-ink" : "text-navy"
                        )}
                      >
                        {notification.title}
                      </h3>
                      <span className="text-xs text-muted whitespace-nowrap">
                        {formatRelativeTime(notification.createdAt)}
                      </span>
                    </div>
                    
                    <p className={cn(
                      "text-sm leading-relaxed mb-2 line-clamp-2",
                      notification.isRead ? "text-muted" : "text-ink"
                    )}>
                      {notification.body}
                    </p>
                    
                    {notification.trackingCode && (
                      <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-surface text-[11px] font-mono font-medium text-navy border border-border">
                        #{notification.trackingCode}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Visual Accent for Unread */}
                {!notification.isRead && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue rounded-l-xl" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
