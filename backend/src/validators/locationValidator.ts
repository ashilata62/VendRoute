import { z } from 'zod';

export const createLocationSchema = z.object({
  customerId: z.string().uuid('Invalid customer ID'),
  name: z.string().min(2, 'Location name is required'),
  address: z.string().min(5, 'Address is required'),
  city: z.string().min(2, 'City is required'),
  latitude: z.number(),
  longitude: z.number(),
});

export const updateLocationSchema = createLocationSchema.partial();
