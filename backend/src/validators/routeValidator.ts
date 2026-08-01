import { z } from 'zod';

export const createRouteSchema = z.object({
  driverId: z.string().uuid('Invalid driver ID'),
  title: z.string().min(3, 'Route title is required'),
  scheduledDate: z.string().or(z.date()),
  locationIds: z.array(z.string().uuid()).min(1, 'At least one location stop is required'),
});

export const updateStopStatusSchema = z.object({
  status: z.enum(['PENDING', 'REACHED', 'COMPLETED', 'SKIPPED']),
});
