import { create } from "zustand";
import { mockNotifications } from "../data/mockData";
import type { AppNotification } from "../types";

interface NotificationState {
  notifications: AppNotification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllRead: () => void;
  addNotification: (n: Omit<AppNotification, "id" | "timestamp" | "read">) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: mockNotifications,
  unreadCount: mockNotifications.filter((n) => !n.read).length,
  markAsRead: (id) =>
    set((s) => {
      const updated = s.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      );
      return { notifications: updated, unreadCount: updated.filter((n) => !n.read).length };
    }),
  markAllRead: () =>
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    })),
  addNotification: (n) =>
    set((s) => {
      const newN: AppNotification = {
        ...n,
        id: `n${Date.now()}`,
        timestamp: new Date().toISOString(),
        read: false,
      };
      const updated = [newN, ...s.notifications];
      return { notifications: updated, unreadCount: updated.filter((x) => !x.read).length };
    }),
}));
