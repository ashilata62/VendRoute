import { Request, Response } from 'express';
import { RouteService } from '../services/routeService.js';

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
    const { driverId, title, scheduledDate, locationIds } = req.body;
    const route = await RouteService.create(driverId, title, scheduledDate, locationIds);
    return res.status(201).json({ success: true, data: route });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const updateStopStatus = async (req: Request, res: Response) => {
  try {
    const stopId = req.params.stopId as string;
    const { status } = req.body;
    const stop = await RouteService.updateStopStatus(stopId, status);
    return res.status(200).json({ success: true, data: stop });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};
