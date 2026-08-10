import { create } from "zustand";
import { notificationsApi } from "../services/api";
import { getSocket } from "../services/socket";
import type { AppNotification } from "../types";

interface NotificationState {
  notifications: AppNotification[];
  unreadCount: number;
  isLoading: boolean;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => void;
  markAllRead: () => void;
  addNotification: (n: AppNotification) => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => {
  // Listen for real-time notifications via WebSocket
  const socket = getSocket();

  socket.on("notification:new", (notif: any) => {
    if (!notif) return;
    const formatted: AppNotification = {
      id: notif.id,
      title: notif.title,
      message: notif.message,
      type: notif.type,
      read: notif.read || false,
      timestamp: notif.timestamp || notif.createdAt || new Date().toISOString(),
    };

    set((s) => {
      // Prevent duplicates in state
      if (s.notifications.some((existing) => existing.id === formatted.id || (existing.title === formatted.title && existing.message === formatted.message))) {
        return s;
      }
      return {
        notifications: [formatted, ...s.notifications],
        unreadCount: s.unreadCount + 1,
      };
    });
  });

  return {
    notifications: [],
    unreadCount: 0,
    isLoading: false,

    fetchNotifications: async () => {
      set({ isLoading: true });
      try {
        const res = await notificationsApi.getAll();
        if (res.success) {
          const notifications = res.data.map((n: any) => ({
            id: n.id,
            title: n.title,
            message: n.message,
            type: n.type as AppNotification["type"],
            read: n.read,
            timestamp: n.createdAt,
          }));
          set({
            notifications,
            unreadCount: notifications.filter((n) => !n.read).length,
          });
        }
      } catch (err) {
        console.error("Failed to fetch notifications:", err);
      } finally {
        set({ isLoading: false });
      }
    },

    markAsRead: async (id: string) => {
      try {
        await notificationsApi.markRead(id);
        set((s) => {
          const updated = s.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          );
          return { notifications: updated, unreadCount: updated.filter((n) => !n.read).length };
        });
      } catch (err) {
        console.error("Failed to mark notification as read:", err);
      }
    },

    markAllRead: async () => {
      try {
        await notificationsApi.markAllRead();
        set((s) => ({
          notifications: s.notifications.map((n) => ({ ...n, read: true })),
          unreadCount: 0,
        }));
      } catch (err) {
        console.error("Failed to mark all notifications as read:", err);
      }
    },

    addNotification: (n: AppNotification) =>
      set((s) => ({
        notifications: [n, ...s.notifications],
        unreadCount: s.unreadCount + 1,
      })),
  };
});
