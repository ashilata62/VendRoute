import { Request, Response } from 'express';
import { prisma } from '../config/db.js';
import { AuthRequest } from '../middlewares/authMiddleware.js';

export const syncOfflineData = async (req: AuthRequest, res: Response) => {
  try {
    const driverId = req.user?.id;
    if (!driverId) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const { syncPayload } = req.body;
    if (!syncPayload || !Array.isArray(syncPayload)) return res.status(400).json({ success: false, message: 'Invalid payload' });

    let synced = 0; let failed = 0;
    
    // Simple iterative sync for now
    for (const item of syncPayload) {
      try {
        if (item.type === 'attendance_punch_out') {
          const attendance = await prisma.attendance.findFirst({ where: { driverId, punchOut: null }, orderBy: { punchIn: 'desc' } });
          if (attendance) await prisma.attendance.update({ where: { id: attendance.id }, data: {  punchOut: new Date(item.timestamp) } });
        } else if (item.type === 'route_stop_complete') {
          await prisma.routestop.update({
            where: { id: item.data.routeStopId },
            data: {  status: 'COMPLETED', cashCollected: item.data.cashCollected, notes: item.data.notes, gpsVerified: item.data.gpsVerified }
          });
        }
        synced++;
      } catch (e) { failed++; }
    }
    
    return res.status(200).json({ success: true, message: 'Sync complete', data: {  synced, failed } });
  } catch (error: any) { return res.status(500).json({ success: false, message: error.message }); }
};
