import { Request, Response } from 'express';
import { prisma } from '../config/db.js';
import { AuthRequest } from '../middlewares/authMiddleware.js';

export const createNotification = async (req: AuthRequest, res: Response) => {
  try {
    const { userId, title, message, type } = req.body;
    const notification = await prisma.notification.create({
      data: {  userId, title, message, type: type || 'info' }
    });
    return res.status(201).json({ success: true, data: notification });
  } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
};

export const getNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const userId = (req.query.userId as string) || req.user?.id;
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: notifications });
  } catch (err) { res.status(500).json({ success: false, message: 'Failed to fetch notifications' }); }
};

export const getUnreadCount = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const count = await prisma.notification.count({ where: { userId, read: false } });
    res.json({ success: true, data: {  count } });
  } catch (err) { res.status(500).json({ success: false, message: 'Failed to get count' }); }
};

export const markAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const id = String(req.params['id']);
    const userId = req.user?.id;
    const notification = await prisma.notification.updateMany({
      where: { id, userId },
      data: {  read: true },
    });
    res.json({ success: true, data: notification });
  } catch (err) { res.status(500).json({ success: false, message: 'Failed to mark as read' }); }
};

export const markAllRead = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    await prisma.notification.updateMany({ where: { userId }, data: {  read: true } });
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err) { res.status(500).json({ success: false, message: 'Failed to mark all read' }); }
};

export const deleteNotification = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const userId = req.user?.id;
    await prisma.notification.deleteMany({ where: { id, userId } });
    res.json({ success: true, message: 'Deleted' });
  } catch (err) { res.status(500).json({ success: false, message: 'Failed to delete' }); }
};

export const registerToken = async (req: AuthRequest, res: Response) => {
  try {
    const driverId = req.user?.id;
    const { deviceToken, platform } = req.body;
    if (!driverId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const token = await prisma.notificationtoken.upsert({
      where: { deviceToken },
      update: { driverId, platform },
      create: { driverId, deviceToken, platform }
    });
    res.json({ success: true, data: token });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};
