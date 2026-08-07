import { Request, Response } from 'express';
import { prisma } from '../config/db.js';
import { AuthRequest } from '../middlewares/authMiddleware.js';

export const getDashboardStats = async (req: AuthRequest, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const firstDayOfWeek = new Date(today);
    firstDayOfWeek.setDate(today.getDate() - today.getDay());
    
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const allStops = await prisma.routestop.findMany({ select: { cashCollected: true, status: true, route: { select: { date: true } } } });

    let totalRevenue = 0;
    let todayRevenue = 0;
    let weeklyRevenue = 0;
    let monthlyRevenue = 0;
    let completedStops = 0;
    let missedStops = 0;

    allStops.forEach(stop => {
      totalRevenue += (stop.cashCollected || 0);
      
      const routeDate = new Date(stop.route.date);
      if (routeDate >= today) todayRevenue += (stop.cashCollected || 0);
      if (routeDate >= firstDayOfWeek) weeklyRevenue += (stop.cashCollected || 0);
      if (routeDate >= firstDayOfMonth) monthlyRevenue += (stop.cashCollected || 0);

      if (stop.status === 'COMPLETED') completedStops++;
      if (stop.status === 'SKIPPED') missedStops++;
    });

    const driverCount = await prisma.user.count({ where: { role: 'DRIVER' } });
    const totalDistance = await prisma.route.aggregate({ _sum: { totalDistance: true } });
    
    return res.status(200).json({
      success: true,
      data: { 
        revenue: totalRevenue,
        todayRevenue,
        weeklyRevenue,
        monthlyRevenue,
        completedStops,
        missedStops,
        activeDrivers: driverCount,
        totalDistance: totalDistance._sum.totalDistance || 0,
        averageStopTime: 12.5 // mockup fallback for avg stop time in mins
      }
    });
  } catch (error: any) { return res.status(500).json({ success: false, message: error.message }); }
};

export const getDriverPerformance = async (req: AuthRequest, res: Response) => {
  try {
    const driverId = req.params.driverId as string;
    const routes = await prisma.route.findMany({ where: { driverId }, include: { routestop: true } });
    let totalCash = 0; let totalStops = 0; let completedStops = 0;
    routes.forEach((r: any) => {
      r.routestop.forEach((s: any) => {
        totalStops++;
        if (s.status === 'COMPLETED') completedStops++;
        totalCash += (s.cashCollected || 0);
      });
    });
    return res.status(200).json({
      success: true,
      data: {  totalRoutes: routes.length, totalStops, completedStops, completionRate: totalStops > 0 ? (completedStops/totalStops)*100 : 0, totalCash }
    });
  } catch (error: any) { return res.status(500).json({ success: false, message: error.message }); }
};
