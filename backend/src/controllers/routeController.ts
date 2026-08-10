import { Request, Response } from 'express';
import { RouteService } from '../services/routeService.js';
import { createNotification } from '../services/notificationService.js';
import { optimizeRoute as osrmOptimize } from '../services/optimizationService.js';
import { io } from '../server.js';

export const getRoutes = async (req: Request, res: Response) => {
  try {
    const driverId = req.query.driverId as string | undefined;
    const routes = await RouteService.getAll(driverId);
    const mappedRoutes = routes.map((r: any) => ({
      ...r,
      driver: r.user || null
    }));
    return res.status(200).json({ success: true, data: mappedRoutes });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const getRouteById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const route = await RouteService.getById(id);
    const mappedRoute = route ? { ...route, driver: route.user || null } : null;
    return res.status(200).json({ success: true, data: mappedRoute });
  } catch (error: any) {
    return res.status(404).json({ success: false, message: error.message });
  }
};

export const createRoute = async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    const route = await RouteService.create(payload);
    const mappedRoute = route ? { ...route, driver: route.user || null } : null;

    if (payload.driverId) {
      await createNotification({
        userId: payload.driverId,
        title: 'New Route Assigned',
        message: `You have been assigned a new route: "${payload.name || 'Field Route'}".`,
        type: 'info',
      }, io);
    }

    return res.status(201).json({ success: true, data: mappedRoute });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const updateStopStatus = async (req: Request, res: Response) => {
  try {
    const stopId = req.params.stopId as string;
    const { status, routeName, locationName } = req.body;
    const stop = await RouteService.updateStopStatus(stopId, status);

    // Broadcast real-time stop update to admin dashboard
    if (io) io.emit('stop:updated', stop);

    // Auto-generate notifications based on stop status
    if (status === 'REACHED') {
      await createNotification({
        title: 'Driver Checked-In',
        message: `Driver checked in at ${locationName || 'location'}. GPS verified.`,
        type: 'info',
      }, io);
    }

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
    const mappedRoute = route ? { ...route, driver: route.user || null } : null;

    if (req.body.driverId) {
      await createNotification({
        userId: req.body.driverId,
        title: 'Route Assignment Updated',
        message: `Route "${route.name || 'Field Route'}" has been assigned/updated for you.`,
        type: 'info',
      }, io);
    }

    return res.status(200).json({ success: true, data: mappedRoute });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const optimizeRoute = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const result = await osrmOptimize(id);
    if (result) {
      return res.status(200).json({ success: true, message: 'Route optimized successfully' });
    }
    return res.status(400).json({ success: false, message: 'Failed to optimize route' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
