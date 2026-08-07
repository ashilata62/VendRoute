import { PrismaClient } from '@prisma/client';
import { Server } from 'socket.io';

const prisma = new PrismaClient();

interface CreateNotificationInput {
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  userId?: string;
}

export async function createNotification(
  data: CreateNotificationInput,
  io?: Server
) {
  try {
    let targetUserId = data.userId;
    if (!targetUserId) {
      const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
      if (admin) targetUserId = admin.id;
    }

    if (!targetUserId) return; // No target user

    const notification = await prisma.notification.create({ 
      data: {
        userId: targetUserId,
        title: data.title,
        message: data.message,
        type: data.type
      } 
    });

    // Broadcast via WebSocket if io is provided
    if (io) {
      io.emit('notification:new', notification);
    }

    return notification;
  } catch (err) {
    console.error('Failed to create notification:', err);
  }
}
