import { Request, Response } from 'express';
import { prisma } from '../config/db.js';
import { AuthRequest } from '../middlewares/authMiddleware.js';

export const createLog = async (req: AuthRequest, res: Response) => {
  try {
    const driverId = req.user?.id;
    const { routeStopId, productId, quantityAdded, quantityRemoved, remarks } = req.body;
    if (!driverId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const log = await prisma.inventorylog.create({
      data: {  driverId, routeStopId, productId, quantityAdded: quantityAdded || 0, quantityRemoved: quantityRemoved || 0, remarks },
    });
    return res.status(201).json({ success: true, data: log });
  } catch (error: any) { return res.status(500).json({ success: false, message: error.message }); }
};

export const updateLog = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { quantityAdded, quantityRemoved, remarks } = req.body;
    const updated = await prisma.inventorylog.update({
      where: { id },
      data: {  quantityAdded, quantityRemoved, remarks },
    });
    return res.status(200).json({ success: true, data: updated });
  } catch (error: any) { return res.status(500).json({ success: false, message: error.message }); }
};

export const deleteLog = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    await prisma.inventorylog.delete({ where: { id } });
    return res.status(200).json({ success: true, message: 'Deleted successfully' });
  } catch (error: any) { return res.status(500).json({ success: false, message: error.message }); }
};

export const getLogs = async (req: AuthRequest, res: Response) => {
  try {
    const driverId = req.query.driverId as string | undefined;
    const routeStopId = req.query.routeStopId as string | undefined;
    const logs = await prisma.inventorylog.findMany({
      where: {
        ...(driverId ? { driverId: driverId as string } : {}),
        ...(routeStopId ? { routeStopId: routeStopId as string } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true } }, routestop: { include: { location: true } } }
    });
    return res.status(200).json({ success: true, data: logs });
  } catch (error: any) { return res.status(500).json({ success: false, message: error.message }); }
};
