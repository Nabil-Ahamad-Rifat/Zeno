import { Router } from 'express'
import { z } from 'zod'
import rateLimit from 'express-rate-limit'
import { register, login, logout, me } from '../controllers/authController.js'
import validate from '../middleware/validate.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

const registerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['shopkeeper', 'customer']),
})

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
})

const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // 5 requests per window
  message: 'Too many login attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
})

router.post('/register', validate(registerSchema), register)
router.post('/login', loginLimiter, validate(loginSchema), login)
router.post('/logout', logout)
router.get('/me', requireAuth, me)

export default router
