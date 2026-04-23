// ── app/citizen/notifications/page.tsx ──
// Notifications page - shows user's notifications

"use client";

import { useNotifications } from "@/hooks/useNotifications";
import { Check } from "lucide-react";
import { cn, formatRelativeTime } from "@/lib/utils";
import EmptyState from "@/components/dashboard/shared/EmptyState";
import LoadingSkeleton from "@/components/dashboard/shared/LoadingSkeleton";
import { useRouter } from "next/navigation";

export default function NotificationsPage() {
  const router = useRouter();
  const { notifications, isLoading, unreadCount, markAllRead, refetch } =
    useNotifications(1);

  const handleMarkRead = async (notificationId: string, reportId: string | null) => {
    // Navigate to report detail if available
    if (reportId) {
      router.push(`/citizen/reports/${reportId}`);
    }
    // Mark as read will be handled by the detail page or we can add an endpoint
  };

  return (
    <div className="dashboard-page">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold font-display text-navy">
              Notifikasi
            </h1>
            {unreadCount > 0 && (
              <p className="text-sm text-muted mt-1">
                {unreadCount} notifikasi belum dibaca
              </p>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllRead}
              className="flex items-center gap-2 text-sm font-medium text-blue hover:text-blue/80 transition-colors min-h-[44px] px-3"
            >
              <Check size={16} />
              <span className="hidden sm:inline">Tandai semua dibaca</span>
              <span className="sm:hidden">Tandai semua</span>
            </button>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-3">
            <LoadingSkeleton variant="notification" rows={5} />
          </div>
        )}

        {/* Empty State */}
        {!isLoading && notifications.length === 0 && (
          <EmptyState
            icon="🔔"
            title="Belum ada notifikasi"
            description="Notifikasi tentang laporan kamu akan muncul di sini."
          />
        )}

        {/* Notification List */}
        {!isLoading && notifications.length > 0 && (
          <div className="space-y-2">
            {notifications.map((notification) => (
              <button
                key={notification.id}
                type="button"
                onClick={() =>
                  handleMarkRead(notification.id, notification.reportId)
                }
                className={cn(
                  "w-full text-left rounded-xl border p-4 transition-all duration-200",
                  "hover:shadow-md hover:border-blue/20",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue",
                  notification.isRead
                    ? "bg-white border-border"
                    : "bg-blue-light/30 border-blue/20"
                )}
              >
                <div className="flex items-start gap-3">
                  {/* Unread Indicator */}
                  {!notification.isRead && (
                    <div className="mt-1.5 h-2 w-2 rounded-full bg-blue shrink-0" />
                  )}

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3
                      className={cn(
                        "text-sm font-semibold font-display mb-1",
                        notification.isRead ? "text-ink" : "text-navy"
                      )}
                    >
                      {notification.title}
                    </h3>
                    <p className="text-sm text-muted leading-relaxed mb-2">
                      {notification.body}
                    </p>
                    <p className="text-xs text-muted">
                      {formatRelativeTime(notification.createdAt)}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
