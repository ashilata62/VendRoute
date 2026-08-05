import { prisma } from '../config/db.js';

export class RouteService {
  static async getAll(driverId?: string) {
    return await prisma.route.findMany({
      where: driverId ? { driverId } : undefined,
      include: {
        driver: { select: { id: true, name: true, email: true, phone: true } },
        vehicle: true,
        stops: {
          include: {
            location: {
              include: { machines: true },
            },
          },
          orderBy: { stopOrder: 'asc' },
        },
      },
      orderBy: { date: 'desc' },
    });
  }

  static async getById(id: string) {
    const route = await prisma.route.findUnique({
      where: { id },
      include: {
        driver: { select: { id: true, name: true, email: true, phone: true } },
        vehicle: true,
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

  static async create(payload: { driverId: string; name: string; date: string; vehicleId?: string; totalDistance?: number; estimatedTime?: number; stops: string[] }) {
    const { driverId, name, date, vehicleId, totalDistance, estimatedTime, stops } = payload;
    return await prisma.route.create({
      data: {
        driverId,
        name,
        date,
        vehicleId: vehicleId || undefined,
        totalDistance: totalDistance || 0,
        estimatedTime: estimatedTime || 0,
        stops: {
          create: stops.map((locationId: string, index: number) => ({
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

  static async update(id: string, payload: { driverId?: string; vehicleId?: string; name?: string; date?: string }) {
    const { driverId, vehicleId, name, date } = payload;
    const updateData: any = {};
    if (driverId) updateData.driverId = driverId;
    if (vehicleId !== undefined) updateData.vehicleId = vehicleId || null;
    if (name) updateData.name = name;
    if (date) updateData.date = date;

    return await prisma.route.update({
      where: { id },
      data: updateData,
      include: {
        driver: { select: { id: true, name: true, email: true, phone: true } },
        vehicle: true,
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
  }

  static async delete(id: string) {
    // Delete stops first because of foreign key constraint
    await prisma.routeStop.deleteMany({
      where: { routeId: id },
    });
    return await prisma.route.delete({
      where: { id },
    });
  }
}
