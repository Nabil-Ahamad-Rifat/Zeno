import { Router } from 'express'
import { z } from 'zod'
import { createShopHandler, getShop } from '../controllers/shopController.js'
import validate from '../middleware/validate.js'
import auth from '../middleware/auth.js'

const router = Router()

const createShopSchema = z.object({
  name: z.string().min(1, 'Shop name is required').max(100),
  address: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  logoUrl: z.string().optional().nullable(),
})

router.post('/create', auth, validate(createShopSchema), createShopHandler)
router.get('/my-shop', auth, getShop)

export default router
