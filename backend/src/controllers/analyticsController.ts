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
    const routes = await prisma.route.findMany({
      where: { driverId },
      include: { routestop: true },
      orderBy: { date: 'asc' },
    });

    let totalCash = 0;
    let totalStops = 0;
    let completedStops = 0;
    let missedStops = 0;

    const dayMap: Record<string, { day: string; completed: number; missed: number; stops: number }> = {};

    routes.forEach((r: any) => {
      const dayStr = r.date ? new Date(r.date).toLocaleDateString("en-IN", { month: 'short', day: 'numeric' }) : 'Day';
      if (!dayMap[dayStr]) {
        dayMap[dayStr] = { day: dayStr, completed: 0, missed: 0, stops: 0 };
      }

      (r.routestop || []).forEach((s: any) => {
        totalStops++;
        dayMap[dayStr].stops++;
        if (s.status === 'COMPLETED') {
          completedStops++;
          dayMap[dayStr].completed++;
        } else if (s.status === 'SKIPPED' || s.status === 'MISSED') {
          missedStops++;
          dayMap[dayStr].missed++;
        }
        totalCash += (s.cashCollected || 0);
      });
    });

    const completionRate = totalStops > 0 ? Math.round((completedStops / totalStops) * 100) : (routes.length > 0 ? 100 : 0);
    const score = totalStops > 0 ? Math.min(100, Math.max(60, completionRate)) : (routes.length > 0 ? 85 : 80);

    const completionRateByDay = Object.values(dayMap);
    const stopVolumeByDay = Object.values(dayMap).map(d => ({ day: d.day, stops: d.stops }));

    return res.status(200).json({
      success: true,
      data: {
        totalRoutes: routes.length,
        totalStops,
        completedStops,
        missedStops,
        completionRate,
        score,
        totalCash,
        historicalData: {
          completionRateByDay,
          stopVolumeByDay,
        },
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
