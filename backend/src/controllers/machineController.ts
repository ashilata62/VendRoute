import { Request, Response } from 'express';
import { MachineService } from '../services/machineService.js';

export const getMachines = async (req: Request, res: Response) => {
  try {
    const machines = await MachineService.getAll();
    return res.status(200).json({ success: true, data: machines });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const createMachine = async (req: Request, res: Response) => {
  try {
    const machine = await MachineService.create(req.body);
    return res.status(201).json({ success: true, data: machine });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const updateMachineStock = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { fillLevel, status } = req.body;
    const machine = await MachineService.updateStock(id, fillLevel, status);
    return res.status(200).json({ success: true, data: machine });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};
