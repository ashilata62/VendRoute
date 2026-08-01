import { z } from 'zod';

export const createCustomerSchema = z.object({
  companyName: z.string().min(2, 'Company name is required'),
  contactPerson: z.string().min(2, 'Contact person name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(8, 'Phone number is required'),
  industry: z.string().optional(),
});

export const updateCustomerSchema = createCustomerSchema.partial();
