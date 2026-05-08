import { Router } from 'express'
import { z } from 'zod'
import {
  getPurchases,
  getMemo,
  updateProfile,
  getSocialAccounts,
  disconnectAccount,
} from '../controllers/meController.js'
import validate from '../middleware/validate.js'
import auth from '../middleware/auth.js'

const router = Router()

const profileSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().optional().nullable(),
  avatarUrl: z.string().optional().nullable(),
})

router.use(auth)

router.get('/purchases', getPurchases)
router.get('/memos/:saleId', getMemo)
router.put('/profile', validate(profileSchema), updateProfile)
router.get('/social-accounts', getSocialAccounts)
router.delete('/social-accounts/:accountId', disconnectAccount)

export default router
