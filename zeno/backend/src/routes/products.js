import { Router } from 'express'
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} from '../controllers/productController.js'
import validate from '../middleware/validate.js'
import auth from '../middleware/auth.js'
import productSchema from '../schemas/productSchema.js'

const router = Router()

router.use(auth)

router.post('/', validate(productSchema), createProduct)
router.get('/', getProducts)
router.get('/:id', getProductById)
router.put('/:id', validate(productSchema.partial()), updateProduct)
router.delete('/:id', deleteProduct)

export default router
