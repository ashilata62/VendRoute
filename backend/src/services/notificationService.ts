import { PrismaClient } from '@prisma/client';
import { Server } from 'socket.io';

const prisma = new PrismaClient();

interface CreateNotificationInput {
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
}

export async function createNotification(
  data: CreateNotificationInput,
  io?: Server
) {
  try {
    const notification = await prisma.notification.create({ data });

    // Broadcast via WebSocket if io is provided
    if (io) {
      io.emit('notification:new', notification);
    }

    return notification;
  } catch (err) {
    console.error('Failed to create notification:', err);
  }
}
