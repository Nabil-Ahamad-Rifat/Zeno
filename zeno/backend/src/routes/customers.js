import { Router } from 'express'
import {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
} from '../controllers/customerController.js'
import validate from '../middleware/validate.js'
import auth from '../middleware/auth.js'
import customerSchema from '../schemas/customerSchema.js'

const router = Router()

router.use(auth)

router.post('/', validate(customerSchema), createCustomer)
router.get('/', getCustomers)
router.get('/:id', getCustomerById)
router.put('/:id', validate(customerSchema.partial()), updateCustomer)
router.delete('/:id', deleteCustomer)

export default router
