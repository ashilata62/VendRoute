import { Request, Response } from 'express';
import { prisma } from '../config/db.js';
import { io } from '../server.js';
import { createNotification } from '../services/notificationService.js';

// GET /stops — list all stops (for admin StopsPage)
export const getStops = async (req: Request, res: Response) => {
  try {
    const stops = await prisma.routestop.findMany({
      include: {
        route: {
          include: {
            user: { select: { id: true, name: true, avatar: true } },
            vehicle: true,
          }
        },
        location: {
          include: { 
            customer: true,
            machine: true
          }
        }
      },
      orderBy: { route: { date: 'desc' } },
    });

    const mappedStops = stops.map((s: any) => {
      if (s.route) {
        return {
          ...s,
          route: {
            ...s.route,
            driver: s.route.user
          }
        };
      }
      return s;
    });

    return res.status(200).json({ success: true, data: mappedStops });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /stops/:id/checkin — driver check-in
export const checkInStop = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { gpsVerified, cashCollected, productsRefilled, notes, signatureUrl, machineIssues, photos } = req.body;

    // Verify stop exists
    const existingStop = await prisma.routestop.findUnique({ where: { id } });
    if (!existingStop) throw new Error('Stop not found');

    const now = new Date();
    const stopData = { 
      status: 'COMPLETED' as const,
      gpsVerified: gpsVerified !== undefined ? Boolean(gpsVerified) : true,
      cashCollected: parseFloat((cashCollected as string) || '0'),
      productsRefilled: productsRefilled ? (typeof productsRefilled === 'string' ? productsRefilled : JSON.stringify(productsRefilled)) : null,
      notes: notes ? String(notes) : null,
      signatureUrl: signatureUrl ? String(signatureUrl) : null,
      machineIssues: machineIssues ? String(machineIssues) : null,
      photos: photos ? (typeof photos === 'string' ? photos : JSON.stringify(photos)) : null,
      arrivalTime: (existingStop as any).arrivalTime || now,
      departureTime: now,
    };

    let updatedStop;
    try {
      updatedStop = await prisma.routestop.update({
        where: { id },
        data: stopData,
      });
    } catch (dbErr: any) {
      console.warn('Prisma update error, reconnecting...', dbErr.message);
      await prisma.$connect().catch(() => {});
      updatedStop = await prisma.routestop.update({
        where: { id },
        data: stopData,
      });
    }

    // ✅ Auto-complete Route if ALL its stops are now COMPLETED or SKIPPED
    const allStopsOfRoute = await prisma.routestop.findMany({
      where: { routeId: existingStop.routeId },
    });
    const allFinished = allStopsOfRoute.every(s => s.id === id || s.status === 'COMPLETED' || s.status === 'SKIPPED');

    const stopWithLoc = await prisma.routestop.findUnique({
      where: { id },
      include: { location: true, route: true }
    });
    const locName = stopWithLoc?.location?.name || 'Stop';
    const rName = stopWithLoc?.route?.name || 'Route';

    // Send Notification to Admin & Supervisor
    await createNotification({
      title: 'Stop Completed',
      message: `${locName} was completed on ${rName}.`,
      type: 'success',
    }, io);

    if (allFinished) {
      await prisma.route.update({
        where: { id: existingStop.routeId },
        data: { 
          status: 'COMPLETED',
          endTime: new Date(),
        },
      });

      await createNotification({
        title: 'Route Completed',
        message: `All stops on route "${rName}" have been completed!`,
        type: 'success',
      }, io);
    } else {
      // Set route to IN_PROGRESS if not already
      await prisma.route.update({
        where: { id: existingStop.routeId },
        data: {  status: 'IN_PROGRESS' },
      });
    }

    if (io) io.emit('stop:updated', updatedStop);

    return res.status(200).json({ success: true, data: updatedStop });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message, stack: error.stack });
  }
};

