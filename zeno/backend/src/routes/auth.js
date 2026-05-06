import { Router } from 'express'
import { z } from 'zod'
import { login } from '../controllers/authController.js'
import validate from '../middleware/validate.js'

const router = Router()

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
})

router.post('/login', validate(loginSchema), login)

export default router
