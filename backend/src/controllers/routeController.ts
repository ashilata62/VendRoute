import { Request, Response } from 'express';
import { RouteService } from '../services/routeService.js';
import { createNotification } from '../services/notificationService.js';
import { io } from '../server.js';

export const getRoutes = async (req: Request, res: Response) => {
  try {
    const driverId = req.query.driverId as string | undefined;
    const routes = await RouteService.getAll(driverId);
    return res.status(200).json({ success: true, data: routes });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const getRouteById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const route = await RouteService.getById(id);
    return res.status(200).json({ success: true, data: route });
  } catch (error: any) {
    return res.status(404).json({ success: false, message: error.message });
  }
};

export const createRoute = async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    const route = await RouteService.create(payload);
    return res.status(201).json({ success: true, data: route });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const updateStopStatus = async (req: Request, res: Response) => {
  try {
    const stopId = req.params.stopId as string;
    const { status, routeName, locationName } = req.body;
    const stop = await RouteService.updateStopStatus(stopId, status);

    // Auto-generate notifications based on stop status
    if (status === 'SKIPPED') {
      await createNotification({
        title: 'Stop Missed',
        message: `${locationName || 'A stop'} was skipped on ${routeName || 'route'}. Follow up with driver.`,
        type: 'error',
      }, io);
    }

    if (status === 'COMPLETED') {
      await createNotification({
        title: 'Stop Completed',
        message: `${locationName || 'Stop'} successfully completed on ${routeName || 'route'}.`,
        type: 'success',
      }, io);
    }

    return res.status(200).json({ success: true, data: stop });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteRoute = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    await RouteService.delete(id);
    return res.status(200).json({ success: true, message: 'Route deleted successfully' });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const updateRoute = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const route = await RouteService.update(id, req.body);
    return res.status(200).json({ success: true, data: route });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

