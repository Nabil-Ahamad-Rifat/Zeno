import { Router } from 'express'
import { createSale, getSales, getSaleById, getMemoPDF, resendMemoEmail } from '../controllers/saleController.js'
import validate from '../middleware/validate.js'
import auth from '../middleware/auth.js'
import saleSchema from '../schemas/saleSchema.js'

const router = Router()

router.use(auth)

router.post('/', validate(saleSchema), createSale)
router.get('/', getSales)
router.get('/:id/memo.pdf', getMemoPDF)
router.post('/:id/resend-memo', resendMemoEmail)
router.get('/:id', getSaleById)

export default router
