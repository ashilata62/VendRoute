import { Request, Response } from 'express';
import { SettingsService } from '../services/settingsService.js';

export const getSettings = async (_req: Request, res: Response) => {
  try {
    const data = await SettingsService.get();
    return res.status(200).json({ success: true, data });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateSettings = async (req: Request, res: Response) => {
  try {
    const updated = await SettingsService.upsert(req.body);
    return res.status(200).json({ success: true, data: updated.data });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
