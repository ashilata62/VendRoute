import { Request, Response } from 'express';
import { prisma } from '../config/db.js';

// GET /reports/dashboard — returns all stats for dashboard cards
export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    const [
      totalRoutes,
      todayRoutes,
      activeRoutes,
      completedRoutes,
      pendingRoutes,
      totalLocations,
      totalMachines,
      machineAlerts,
      totalStops,
      completedStops,
      allDrivers,
      activeDriversCountDB,
    ] = await Promise.all([
      prisma.route.count(),
      prisma.route.count({ where: { date: today } }),
      prisma.route.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.route.count({ where: { status: 'COMPLETED' } }),
      prisma.route.count({ where: { status: 'PENDING' } }),
      prisma.location.count(),
      prisma.machine.count(),
      prisma.machine.count({ where: { status: { not: 'ACTIVE' } } }),
      prisma.routeStop.count(),
      prisma.routeStop.count({ where: { status: 'COMPLETED' } }),
      prisma.user.findMany({ where: { role: 'DRIVER' }, select: { id: true } }),
      (prisma.user as any).count({ where: { role: 'DRIVER', isOnline: true } }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        routes: {
          total: totalRoutes,
          today: todayRoutes,
          active: activeRoutes,
          completed: completedRoutes,
          pending: pendingRoutes,
        },
        drivers: {
          total: allDrivers.length,
          active: activeDriversCountDB,
        },
        // Real driver UUIDs for seeding map GPS pins on frontend
        driverIds: allDrivers.map((d) => d.id),
        locations: {
          total: totalLocations,
        },
        machines: {
          total: totalMachines,
          alerts: machineAlerts,
        },
        stops: {
          total: totalStops,
          completed: completedStops,
          pending: totalStops - completedStops,
          completionRate: totalStops > 0 ? Math.round((completedStops / totalStops) * 100) : 0,
        },
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
