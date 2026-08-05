import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/v1/notifications — all notifications, newest first
export const getNotifications = async (req: Request, res: Response) => {
  try {
    const notifications = await prisma.notification.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: notifications });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
  }
};

// GET /api/v1/notifications/unread-count — for bell badge
export const getUnreadCount = async (req: Request, res: Response) => {
  try {
    const count = await prisma.notification.count({ where: { read: false } });
    res.json({ success: true, data: { count } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to get count' });
  }
};

// PATCH /api/v1/notifications/:id/read — mark one as read
export const markAsRead = async (req: Request, res: Response) => {
  try {
    const id = String(req.params['id']);
    const notification = await prisma.notification.update({
      where: { id },
      data: { read: true },
    });
    res.json({ success: true, data: notification });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to mark as read' });
  }
};

// PATCH /api/v1/notifications/mark-all-read — mark all as read
export const markAllRead = async (req: Request, res: Response) => {
  try {
    await prisma.notification.updateMany({ data: { read: true } });
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to mark all read' });
  }
};
