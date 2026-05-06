import { z } from 'zod'

const customerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().min(1, 'Phone is required'),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  tag: z.enum(['new', 'regular', 'vip']).optional(),
})

export default customerSchema
