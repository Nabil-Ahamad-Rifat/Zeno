import { z } from 'zod'

const productSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  category: z.string().min(1, 'Category is required'),
  unit: z.string().min(1, 'Unit is required'),
  price: z.coerce.number().positive('Price must be positive'),
  costPrice: z.coerce.number().positive('Cost price must be positive'),
  stockQty: z.coerce.number().int().nonnegative('Stock quantity cannot be negative').optional(),
  minStock: z.coerce.number().int().nonnegative('Minimum stock cannot be negative').optional(),
  expiryDate: z.coerce.date().optional().or(z.literal('')),
})

export default productSchema
