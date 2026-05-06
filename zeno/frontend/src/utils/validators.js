import { z } from 'zod'

export const customerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().min(1, 'Phone is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  address: z.string().optional(),
  tag: z.enum(['new', 'regular', 'vip']).optional(),
})

export const productSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  category: z.string().min(1, 'Category is required'),
  unit: z.string().min(1, 'Unit is required'),
  price: z.coerce
    .number()
    .positive('Price must be positive'),
  costPrice: z.coerce
    .number()
    .positive('Cost price must be positive'),
  stockQty: z.coerce
    .number()
    .int()
    .nonnegative('Stock quantity cannot be negative')
    .optional()
    .default(0),
  minStock: z.coerce
    .number()
    .int()
    .nonnegative('Minimum stock cannot be negative')
    .optional()
    .default(0),
  expiryDate: z.coerce.date().optional().or(z.literal('')),
})
