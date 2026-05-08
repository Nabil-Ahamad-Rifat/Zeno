import { Router } from 'express'
import { z } from 'zod'
import {
  inviteSeller,
  getInvitationInfo,
  acceptInvitationHandler,
  listStaff,
  removeStaff,
} from '../controllers/staffController.js'
import validate from '../middleware/validate.js'
import auth from '../middleware/auth.js'
import requireRole from '../middleware/requireRole.js'

const router = Router()

const inviteSchema = z.object({
  email: z.string().email('Invalid email'),
})

const acceptInviteSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

// Shopkeeper only routes
router.post('/invite', auth, requireRole('shopkeeper'), validate(inviteSchema), inviteSeller)
router.get('/', auth, requireRole('shopkeeper'), listStaff)
router.delete('/:id', auth, requireRole('shopkeeper'), removeStaff)

// Public routes for accepting invitations
router.get('/invite/:token', getInvitationInfo)
router.post('/invite/:token/accept', validate(acceptInviteSchema), acceptInvitationHandler)

export default router
