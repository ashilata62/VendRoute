import { Request, Response } from 'express';
import { prisma } from '../config/db.js';
import { AuthRequest } from '../middlewares/authMiddleware.js';

export const punchIn = async (req: AuthRequest, res: Response) => {
  try {
    const driverId = req.user?.id;
    const d = new Date();
    const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (!driverId) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const existing = await prisma.attendance.findFirst({ where: { driverId, date } });
    if (existing) return res.status(400).json({ success: false, message: 'Already punched in' });
    const attendance = await prisma.attendance.create({ data: {  driverId, date, punchIn: new Date(), status: 'PRESENT' } });
    return res.status(201).json({ success: true, data: attendance });
  } catch (error: any) { return res.status(500).json({ success: false, message: error.message }); }
};

export const punchOut = async (req: AuthRequest, res: Response) => {
  try {
    const driverId = req.user?.id;
    const d = new Date();
    const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const attendance = await prisma.attendance.findFirst({ where: { driverId, date } });
    if (!attendance) return res.status(400).json({ success: false, message: 'No punch-in found' });
    if (attendance.punchOut) return res.status(400).json({ success: false, message: 'Already punched out' });
    const punchOutTime = new Date();
    const workingHours = (punchOutTime.getTime() - attendance.punchIn.getTime()) / (1000 * 60 * 60);
    const updated = await prisma.attendance.update({ where: { id: attendance.id }, data: {  punchOut: punchOutTime, workingHours } });
    return res.status(200).json({ success: true, data: updated });
  } catch (error: any) { return res.status(500).json({ success: false, message: error.message }); }
};

export const breakStart = async (req: AuthRequest, res: Response) => {
  try {
    const driverId = req.user?.id;
    const d = new Date();
    const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const attendance = await prisma.attendance.findFirst({ where: { driverId, date } });
    if (!attendance) return res.status(400).json({ success: false, message: 'No punch-in found' });
    const updated = await prisma.attendance.update({ where: { id: attendance.id }, data: {  breakStart: new Date() } });
    return res.status(200).json({ success: true, data: updated });
  } catch (error: any) { return res.status(500).json({ success: false, message: error.message }); }
};

export const breakEnd = async (req: AuthRequest, res: Response) => {
  try {
    const driverId = req.user?.id;
    const d = new Date();
    const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const attendance = await prisma.attendance.findFirst({ where: { driverId, date } });
    if (!attendance || !attendance.breakStart) return res.status(400).json({ success: false, message: 'No break started' });
    const updated = await prisma.attendance.update({ where: { id: attendance.id }, data: {  breakEnd: new Date() } });
    return res.status(200).json({ success: true, data: updated });
  } catch (error: any) { return res.status(500).json({ success: false, message: error.message }); }
};

export const getHistory = async (req: AuthRequest, res: Response) => {
  try {
    const driverId = req.query.driverId as string;
    let filterDriverId = req.user?.id;
    if (req.user?.role === 'ADMIN' || req.user?.role === 'SUPERVISOR') filterDriverId = (driverId as string) || undefined;
    const history = await prisma.attendance.findMany({ where: filterDriverId ? { driverId: filterDriverId } : undefined, orderBy: { date: 'desc' }, include: { user: { select: { name: true, email: true } } } });
    return res.status(200).json({ success: true, data: history });
  } catch (error: any) { return res.status(500).json({ success: false, message: error.message }); }
};
