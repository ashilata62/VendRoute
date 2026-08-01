import { prisma } from '../config/db.js';

export class RouteService {
  static async getAll(driverId?: string) {
    return await prisma.route.findMany({
      where: driverId ? { driverId } : undefined,
      include: {
        driver: { select: { id: true, name: true, email: true, phone: true } },
        stops: {
          include: {
            location: {
              include: { machines: true },
            },
          },
          orderBy: { stopOrder: 'asc' },
        },
      },
      orderBy: { scheduledDate: 'desc' },
    });
  }

  static async getById(id: string) {
    const route = await prisma.route.findUnique({
      where: { id },
      include: {
        driver: { select: { id: true, name: true, email: true, phone: true } },
        stops: {
          include: {
            location: {
              include: { machines: true },
            },
          },
          orderBy: { stopOrder: 'asc' },
        },
      },
    });
    if (!route) throw new Error('Route not found');
    return route;
  }

  static async create(driverId: string, title: string, scheduledDate: string | Date, locationIds: string[]) {
    return await prisma.route.create({
      data: {
        driverId,
        title,
        scheduledDate: new Date(scheduledDate),
        stops: {
          create: locationIds.map((locationId, index) => ({
            locationId,
            stopOrder: index + 1,
          })),
        },
      },
      include: { stops: true },
    });
  }

  static async updateStopStatus(stopId: string, status: any) {
    return await prisma.routeStop.update({
      where: { id: stopId },
      data: { status },
    });
  }
}
