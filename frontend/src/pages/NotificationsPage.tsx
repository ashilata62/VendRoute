import { Info, AlertTriangle, CheckCircle, XCircle, Check, CheckCheck } from "lucide-react";
import { useEffect } from "react";
import { useNotificationStore } from "../store/notificationStore";
import PageHeader from "../components/shared/PageHeader";
import { cn } from "../lib/utils";
import type { NotificationType } from "../types";

const typeConfig: Record<NotificationType, { icon: typeof Info; color: string; bg: string }> = {
  info: { icon: Info, color: "text-blue-600", bg: "bg-blue-50" },
  warning: { icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50" },
  success: { icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50" },
  error: { icon: XCircle, color: "text-danger", bg: "bg-red-50" },
};

function timeAgo(ts?: string): string {
  if (!ts) return "Just now";
  const date = new Date(ts);
  const time = date.getTime();
  if (isNaN(time)) return "Just now";
  const diff = Math.max(0, Date.now() - time);
  const hours = Math.floor(diff / 3600000);
  const mins = Math.floor(diff / 60000);
  if (hours >= 24) return `${Math.floor(hours / 24)}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (mins < 1) return "Just now";
  return `${mins}m ago`;
}

export default function NotificationsPage() {
  const { notifications, unreadCount, markAsRead, markAllRead, fetchNotifications, isLoading } = useNotificationStore();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const unread = notifications.filter((n) => !n.read);
  const read = notifications.filter((n) => n.read);

  return (
    <div>
      <PageHeader
        title="Notifications"
        description={`${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}`}
        action={
          unreadCount > 0 && (
            <button onClick={markAllRead} className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 border border-primary-200 bg-primary-50 px-3 py-2 rounded-lg transition-colors">
              <CheckCheck className="w-4 h-4" /> Mark all read
            </button>
          )
        }
      />

      <div className="max-w-2xl space-y-6">
        {/* Unread */}
        {unread.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Unread</p>
            <div className="space-y-2">
              {unread.map((n) => {
                const { icon: Icon, color, bg } = typeConfig[n.type];
                return (
                  <div key={n.id} className="bg-card border border-primary-100 shadow-sm rounded-lg p-4 flex gap-3 hover:shadow-md transition-shadow">
                    <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0", bg)}>
                      <Icon className={cn("w-4 h-4", color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-900">{n.title}</p>
                        <span className="text-xs text-slate-400 flex-shrink-0">{timeAgo(n.timestamp)}</span>
                      </div>
                      <p className="text-sm text-slate-600 mt-0.5">{n.message}</p>
                    </div>
                    <button
                      onClick={() => markAsRead(n.id)}
                      className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-md transition-colors flex-shrink-0"
                      title="Mark as read"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Read */}
        {read.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Earlier</p>
            <div className="space-y-2">
              {read.map((n) => {
                const { icon: Icon, color, bg } = typeConfig[n.type];
                return (
                  <div key={n.id} className="bg-card border border-border rounded-lg p-4 flex gap-3 opacity-70 hover:opacity-100 transition-opacity">
                    <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0", bg)}>
                      <Icon className={cn("w-4 h-4", color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-slate-700">{n.title}</p>
                        <span className="text-xs text-slate-400 flex-shrink-0">{timeAgo(n.timestamp)}</span>
                      </div>
                      <p className="text-sm text-slate-500 mt-0.5">{n.message}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {notifications.length === 0 && (
          <div className="text-center py-20 text-slate-400">
            <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">All caught up!</p>
          </div>
        )}
      </div>
    </div>
  );
}
