import { Router } from 'express'
import { createFeedback, getFeedback, getSaleStats } from '../controllers/feedbackController.js'
import validate from '../middleware/validate.js'
import auth from '../middleware/auth.js'
import feedbackSchema from '../schemas/feedbackSchema.js'

const router = Router()

// Public endpoints (no auth needed for feedback submission)
router.get('/:feedbackToken', getFeedback)
router.post('/:feedbackToken', validate(feedbackSchema), createFeedback)

// Protected endpoint
router.use(auth)
router.get('/stats/overview', getSaleStats)

export default router
