import { Request, Response } from 'express';
import { prisma } from '../config/db.js';

// GET /reports/dashboard — returns all stats for dashboard cards
export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    let today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    if (req.query.date && typeof req.query.date === 'string') {
      today = req.query.date;
    }

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
      revenueAgg,
      todayMissedStops,
      opMachines,
      nsMachines,
      offMachines,
    ] = await Promise.all([
      prisma.route.count(),
      prisma.route.count({ where: { date: today } }),
      prisma.route.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.route.count({ where: { status: 'COMPLETED' } }),
      prisma.route.count({ where: { status: 'PENDING' } }),
      prisma.location.count(),
      prisma.machine.count(),
      prisma.machine.count({ where: { status: { not: 'ACTIVE' } } }),
      prisma.routestop.count(),
      prisma.routestop.count({ where: { status: 'COMPLETED' } }),
      prisma.user.findMany({ where: { role: 'DRIVER' }, select: { id: true } }),
      (prisma.user as any).count({ where: { role: 'DRIVER', isOnline: true } }),
      // New Metrics
      prisma.routestop.aggregate({
        _sum: { cashCollected: true },
        where: { route: { date: today } }
      }),
      prisma.routestop.count({
        where: { status: 'SKIPPED', route: { date: today } }
      }),
      prisma.machine.count({ where: { status: 'ACTIVE' } }),
      prisma.machine.count({ where: { status: 'NEEDS_MAINTENANCE' } }),
      prisma.machine.count({ where: { status: { in: ['INACTIVE', 'OUT_OF_STOCK'] } } }),
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
        location: {
          total: totalLocations,
        },
        machine: {
          total: totalMachines,
          alerts: machineAlerts,
          statusCounts: [
            { name: "Operational", value: opMachines, color: "#10B981" },
            { name: "Needs Service", value: nsMachines, color: "#F59E0B" },
            { name: "Offline", value: offMachines, color: "#EF4444" },
          ]
        },
        routestop: {
          total: totalStops,
          completed: completedStops,
          pending: totalStops - completedStops,
          completionRate: totalStops > 0 ? Math.round((completedStops / totalStops) * 100) : 0,
          missedToday: todayMissedStops,
        },
        revenue: {
          today: revenueAgg._sum.cashCollected || 0
        }
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
