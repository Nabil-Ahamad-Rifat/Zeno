import express from 'express'
import {
  getSalesReport,
  getStockReport,
  getCustomersReport,
  getProfitReport,
} from '../controllers/reportController.js'
import auth from '../middleware/auth.js'

const router = express.Router()

router.get('/sales', auth, getSalesReport)
router.get('/stock', auth, getStockReport)
router.get('/customers', auth, getCustomersReport)
router.get('/profit', auth, getProfitReport)

export default router
