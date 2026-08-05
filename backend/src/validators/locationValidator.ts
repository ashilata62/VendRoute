import { z } from 'zod';

export const createLocationSchema = z.object({
  customerId: z.string().uuid('Invalid customer ID'),
  name: z.string().min(2, 'Location name is required'),
  address: z.string().min(5, 'Address is required'),
  city: z.string().min(2, 'City is required'),
  latitude: z.coerce.number({ invalid_type_error: 'Latitude must be a valid number' }),
  longitude: z.coerce.number({ invalid_type_error: 'Longitude must be a valid number' }),
  imageUrl: z.string().optional().nullable(),
  productsStocked: z.array(z.string()).optional(),
});

export const updateLocationSchema = createLocationSchema.partial();
