import { Router } from 'express'
import { z } from 'zod'
import {
  stats,
  listUsers,
  handleBanUser,
  handleUnbanUser,
  handleUpdateRole,
  listShops,
  handleSuspendShop,
} from '../controllers/adminController.js'
import validate from '../middleware/validate.js'
import auth from '../middleware/auth.js'
import requireRole from '../middleware/requireRole.js'

const router = Router()

const updateRoleSchema = z.object({
  role: z.enum(['admin', 'shopkeeper', 'seller', 'customer']),
})

router.use(auth)
router.use(requireRole('admin'))

router.get('/stats', stats)
router.get('/users', listUsers)
router.put('/users/:id/ban', handleBanUser)
router.put('/users/:id/unban', handleUnbanUser)
router.put('/users/:id/role', validate(updateRoleSchema), handleUpdateRole)
router.get('/shops', listShops)
router.put('/shops/:id/suspend', handleSuspendShop)

export default router
