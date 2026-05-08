import { Router } from 'express'
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getLowStockProducts,
  getCategories,
} from '../controllers/productController.js'
import validate from '../middleware/validate.js'
import auth from '../middleware/auth.js'
import requireActiveShop from '../middleware/requireActiveShop.js'
import productSchema from '../schemas/productSchema.js'

const router = Router()

router.use(auth)

router.post('/', requireActiveShop, validate(productSchema), createProduct)
router.get('/low-stock', getLowStockProducts)
router.get('/categories', getCategories)
router.get('/', getProducts)
router.get('/:id', getProductById)
router.put('/:id', requireActiveShop, validate(productSchema.partial()), updateProduct)
router.delete('/:id', deleteProduct)

export default router
