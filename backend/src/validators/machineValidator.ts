import { z } from 'zod';

export const createMachineSchema = z.object({
  locationId: z.string().uuid('Invalid location ID'),
  machineCode: z.string().min(3, 'Machine code is required'),
  model: z.string().min(2, 'Model name is required'),
  fillLevel: z.number().min(0).max(100).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'NEEDS_MAINTENANCE', 'OUT_OF_STOCK']).optional(),
});

export const updateMachineStockSchema = z.object({
  fillLevel: z.number().min(0).max(100),
  status: z.enum(['ACTIVE', 'INACTIVE', 'NEEDS_MAINTENANCE', 'OUT_OF_STOCK']).optional(),
});
