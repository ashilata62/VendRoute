import { z } from 'zod';

export const createRouteSchema = z.object({
  driverId: z.string().uuid('Invalid driver ID'),
  name: z.string().min(3, 'Route name is required'),
  date: z.string(),
  vehicleId: z.string().optional(),
  totalDistance: z.number().optional(),
  estimatedTime: z.number().optional(),
  stops: z.array(z.string().uuid()).min(1, 'At least one location stop is required'),
});

export const updateStopStatusSchema = z.object({
  status: z.enum(['PENDING', 'REACHED', 'COMPLETED', 'SKIPPED']),
});
