import { Request, Response } from 'express';
import { prisma } from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';
import { createNotification } from '../services/notificationService.js';
import { io } from '../server.js';

// Helper to enrich vehicle with real live GPS telemetry and active route waypoints
const enrichVehicleWithTelemetry = async (vehicle: any) => {
  let liveTracking: any = null;
  let activeRoute: any = null;

  // 1. Fetch latest GPS tracking record for assigned driver
  if (vehicle.assignedDriverId) {
    liveTracking = await prisma.livetracking.findFirst({
      where: { driverId: vehicle.assignedDriverId },
      orderBy: { timestamp: 'desc' },
    });
  }

  // 2. Fetch active or latest route assigned to this vehicle or driver
  const routes = await prisma.route.findMany({
    where: {
      OR: [
        { vehicleId: vehicle.id },
        ...(vehicle.assignedDriverId ? [{ driverId: vehicle.assignedDriverId }] : []),
      ],
    },
    orderBy: { createdAt: 'desc' },
    take: 1,
    include: {
      routestop: {
        include: { location: true },
        orderBy: { stopOrder: 'asc' },
      },
    },
  });

  if (routes.length > 0) {
    activeRoute = routes[0];
  }

  // 3. Compute real route path from route stops
  const routePath: [number, number][] = activeRoute?.routestop
    ? activeRoute.routestop
        .map((s: any) => [s.location?.latitude, s.location?.longitude] as [number, number])
        .filter((coord: [number, number]) => coord[0] != null && coord[1] != null && !isNaN(coord[0]) && !isNaN(coord[1]))
    : [];

  // 4. Compute current location
  let currentLocation: any = null;
  if (liveTracking && liveTracking.latitude && liveTracking.longitude) {
    currentLocation = {
      latitude: liveTracking.latitude,
      longitude: liveTracking.longitude,
      speed: liveTracking.speed ?? 0,
      heading: liveTracking.heading ?? 0,
      timestamp: liveTracking.timestamp,
      isLive: true,
    };
  } else if (routePath.length > 0) {
    const firstStopLoc = activeRoute.routestop[0]?.location;
    currentLocation = {
      latitude: routePath[0][0],
      longitude: routePath[0][1],
      speed: 0,
      heading: 0,
      isLive: false,
      locationName: firstStopLoc?.name || '',
      city: firstStopLoc?.city || '',
    };
  }

  return {
    ...vehicle,
    currentLocation,
    routePath,
    activeRoute: activeRoute
      ? {
          id: activeRoute.id,
          name: activeRoute.name,
          status: activeRoute.status,
          date: activeRoute.date,
          stopsCount: activeRoute.routestop.length,
          stops: activeRoute.routestop.map((s: any) => ({
            id: s.id,
            stopOrder: s.stopOrder,
            name: s.location?.name,
            address: s.location?.address,
            city: s.location?.city,
            latitude: s.location?.latitude,
            longitude: s.location?.longitude,
            status: s.status,
          })),
        }
      : null,
  };
};

export const getVehicles = async (req: Request, res: Response) => {
  try {
    const vehicles = await prisma.vehicle.findMany({
      include: { user: { select: { id: true, name: true, email: true, phone: true, isOnline: true } } },
      orderBy: { model: 'asc' },
    });

    const enrichedVehicles = await Promise.all(
      vehicles.map((v) => enrichVehicleWithTelemetry(v))
    );

    return res.status(200).json({ success: true, data: enrichedVehicles });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const getVehicleById = async (req: Request, res: Response) => {
  try {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: req.params.id as string },
      include: { user: { select: { id: true, name: true, email: true, phone: true, isOnline: true } } },
    });
    if (!vehicle) throw new Error('Vehicle not found');

    const enriched = await enrichVehicleWithTelemetry(vehicle);
    return res.status(200).json({ success: true, data: enriched });
  } catch (error: any) {
    return res.status(404).json({ success: false, message: error.message });
  }
};

export const createVehicle = async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const vehicle = await prisma.vehicle.create({
      data: { 
        id: uuidv4(),
        model: data.model,
        plateNumber: data.plateNumber,
        type: data.type,
        fuelType: data.fuelType,
      }
    });
    return res.status(201).json({ success: true, data: vehicle });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ success: false, message: 'A vehicle with this plate number already exists.' });
    }
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const updateVehicle = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { assignedDriverId, ...rest } = req.body;

    if (assignedDriverId) {
      // Unassign driver from any other vehicle
      await prisma.vehicle.updateMany({
        where: { assignedDriverId, id: { not: id } },
        data: { assignedDriverId: null },
      }).catch(() => {});
    }

    const vehicle = await prisma.vehicle.update({
      where: { id },
      data: req.body,
      include: { user: { select: { id: true, name: true } } },
    });

    if (assignedDriverId) {
      await createNotification({
        userId: assignedDriverId,
        title: 'Vehicle Assigned',
        message: `Vehicle ${vehicle.model} (${vehicle.plateNumber}) has been assigned to you.`,
        type: 'info',
      }, io);
    }

    // Auto-trigger Low Fuel notification if fuel drops below 20%
    if (req.body.currentFuelLevel !== undefined && req.body.currentFuelLevel < 20) {
      await createNotification({
        title: 'Low Fuel Alert',
        message: `Vehicle ${vehicle.model} (${vehicle.plateNumber}) is at ${vehicle.currentFuelLevel}% fuel. Schedule refueling.`,
        type: 'warning',
      }, io);
    }

    // Maintenance due notification if nextMaintenance is set
    if (req.body.nextMaintenance) {
      const daysUntil = Math.ceil(
        (new Date(req.body.nextMaintenance).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      if (daysUntil <= 7 && daysUntil >= 0) {
        await createNotification({
          title: 'Maintenance Due Soon',
          message: `Vehicle ${vehicle.model} (${vehicle.plateNumber}) maintenance is due in ${daysUntil} day(s).`,
          type: 'warning',
        }, io);
      }
    }

    return res.status(200).json({ success: true, data: vehicle });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ success: false, message: 'A vehicle with this plate number already exists.' });
    }
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteVehicle = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    await prisma.vehicle.delete({ where: { id } });
    return res.status(200).json({ success: true, message: 'Vehicle deleted successfully' });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};
