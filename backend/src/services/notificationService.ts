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
    // 🛡️ Deduplication check: ignore if identical notification was created in last 5 seconds
    const fiveSecsAgo = new Date(Date.now() - 5000);
    const existingNotif = await prisma.notification.findFirst({
      where: {
        title: data.title,
        message: data.message,
        createdAt: { gte: fiveSecsAgo }
      }
    });

    if (existingNotif) {
      return existingNotif; // Skip creating duplicate notification
    }

    if (data.userId) {
      // Send targeted notification to specific user (e.g. Driver)
      const notification = await prisma.notification.create({ 
        data: {
          userId: data.userId,
          title: data.title,
          message: data.message,
          type: data.type
        } 
      });

      if (io) {
        io.emit('notification:new', notification);
      }
      return notification;
    }

    // Otherwise, create notifications for all ADMIN and SUPERVISOR users
    const adminsAndSupervisors = await prisma.user.findMany({
      where: { role: { in: ['ADMIN', 'SUPERVISOR'] } },
      select: { id: true }
    });

    const notifications = [];
    let firstNotif: any = null;
    for (const user of adminsAndSupervisors) {
      const notif = await prisma.notification.create({
        data: {
          userId: user.id,
          title: data.title,
          message: data.message,
          type: data.type
        }
      });
      if (!firstNotif) firstNotif = notif;
      notifications.push(notif);
    }

    // Broadcast once to connected web clients
    if (io && firstNotif) {
      io.emit('notification:new', firstNotif);
    }

    return firstNotif;
  } catch (err) {
    console.error('Failed to create notification:', err);
  }
}
