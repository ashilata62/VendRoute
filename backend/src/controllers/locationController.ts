import { Request, Response } from 'express';
import { LocationService } from '../services/locationService.js';

export const getLocations = async (req: Request, res: Response) => {
  try {
    const locations = await LocationService.getAll();
    return res.status(200).json({ success: true, data: locations });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const getLocationById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const location = await LocationService.getById(id);
    return res.status(200).json({ success: true, data: location });
  } catch (error: any) {
    return res.status(404).json({ success: false, message: error.message });
  }
};

export const createLocation = async (req: Request, res: Response) => {
  try {
    const location = await LocationService.create(req.body);
    return res.status(201).json({ success: true, data: location });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const updateLocation = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const location = await LocationService.update(id, req.body);
    return res.status(200).json({ success: true, data: location });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteLocation = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    await LocationService.delete(id);
    return res.status(200).json({ success: true, message: 'Location deleted successfully' });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};
