import { Request, Response } from 'express';
import { prisma } from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';
import { createNotification } from '../services/notificationService.js';
import { io } from '../server.js';

export const getVehicles = async (req: Request, res: Response) => {
  try {
    const vehicles = await prisma.vehicle.findMany({
      include: { user: { select: { id: true, name: true } } },
      orderBy: { model: 'asc' },
    });
    return res.status(200).json({ success: true, data: vehicles });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const getVehicleById = async (req: Request, res: Response) => {
  try {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: req.params.id as string },
      include: { user: { select: { id: true, name: true } } },
    });
    if (!vehicle) throw new Error('Vehicle not found');
    return res.status(200).json({ success: true, data: vehicle });
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
