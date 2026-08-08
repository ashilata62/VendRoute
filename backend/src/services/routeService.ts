import { prisma } from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';

export class RouteService {
  static async getAll(driverId?: string) {
    return await prisma.route.findMany({
      where: driverId ? { driverId } : undefined,
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        vehicle: true,
        routestop: {
          include: {
            location: {
              include: { machine: true },
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
        user: { select: { id: true, name: true, email: true, phone: true } },
        vehicle: true,
        routestop: {
          include: {
            location: {
              include: { machine: true },
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
        id: uuidv4(),
        driverId,
        name,
        date,
        vehicleId: vehicleId || undefined,
        totalDistance: totalDistance || 0,
        estimatedTime: estimatedTime || 0,
        routestop: {
          create: stops.map((locationId: string, index: number) => ({
            id: uuidv4(),
            locationId,
            stopOrder: index + 1,
          })),
        },
      },
      include: { routestop: true },
    });
  }

  static async updateStopStatus(stopId: string, status: any) {
    return await prisma.routestop.update({
      where: { id: stopId },
      data: {  status },
    });
  }

  static async update(id: string, payload: { driverId?: string; vehicleId?: string; name?: string; date?: string; status?: any }) {
    const { driverId, vehicleId, name, date, status } = payload;
    const updateData: any = {};
    if (driverId) updateData.driverId = driverId;
    if (vehicleId !== undefined) updateData.vehicleId = vehicleId || null;
    if (name) updateData.name = name;
    if (date) updateData.date = date;
    if (status) updateData.status = status;

    return await prisma.route.update({
      where: { id },
      data: updateData,
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        vehicle: true,
        routestop: {
          include: {
            location: {
              include: { machine: true },
            },
          },
          orderBy: { stopOrder: 'asc' },
        },
      },
    });
  }

  static async delete(id: string) {
    // Delete stops first because of foreign key constraint
    await prisma.routestop.deleteMany({
      where: { routeId: id },
    });
    return await prisma.route.delete({
      where: { id },
    });
  }
}
