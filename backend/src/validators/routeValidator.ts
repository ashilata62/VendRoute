import { z } from 'zod';

export const createRouteSchema = z.object({
  driverId: z.string().min(1, 'Driver is required'),
  name: z.string().min(1, 'Route name is required'),
  date: z.string(),
  vehicleId: z.string().optional(),
  totalDistance: z.number().optional(),
  estimatedTime: z.number().optional(),
  status: z.string().optional(),
  stops: z.array(z.string()).min(1, 'At least one stop is required'),
});

export const updateStopStatusSchema = z.object({
  status: z.enum(['PENDING', 'REACHED', 'COMPLETED', 'SKIPPED']),
});
