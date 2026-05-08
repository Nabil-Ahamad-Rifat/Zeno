import { z } from 'zod'

const saleSchema = z.object({
  customerId: z.string().optional(),
  discount: z.coerce.number().nonnegative().optional().default(0),
  items: z
    .array(
      z.object({
        productId: z.string(),
        quantity: z.coerce.number().int().positive(),
      })
    )
    .min(1, 'At least one item is required'),
})

export default saleSchema
