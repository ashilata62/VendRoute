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
    
    // Automatically assign vehicle to driver in vehicle table
    if (vehicleId && driverId) {
      try {
        await prisma.vehicle.updateMany({
          where: { assignedDriverId: driverId, id: { not: vehicleId } },
          data: { assignedDriverId: null }
        });
        await prisma.vehicle.update({
          where: { id: vehicleId },
          data: { assignedDriverId: driverId }
        });
      } catch (err) {
        console.error('Error auto-linking vehicle on route create:', err);
      }
    }

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
      include: { 
        routestop: true,
        vehicle: true,
        user: { select: { id: true, name: true, email: true, phone: true } }
      },
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

    // Automatically link vehicle on route update
    if (vehicleId) {
      try {
        const targetDriverId = driverId || (await prisma.route.findUnique({ where: { id }, select: { driverId: true } }))?.driverId;
        if (targetDriverId) {
          await prisma.vehicle.updateMany({
            where: { assignedDriverId: targetDriverId, id: { not: vehicleId } },
            data: { assignedDriverId: null }
          });
          await prisma.vehicle.update({
            where: { id: vehicleId },
            data: { assignedDriverId: targetDriverId }
          });
        }
      } catch (err) {
        console.error('Error auto-linking vehicle on route update:', err);
      }
    }

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
