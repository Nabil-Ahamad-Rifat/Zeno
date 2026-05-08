import mongoose from 'mongoose'
import crypto from 'crypto'
import Sale from '../models/Sale.js'
import Product from '../models/Product.js'
import StockMovement from '../models/StockMovement.js'
import { sendMemoEmail } from '../services/emailService.js'
import { generateMemoPDF } from '../services/memoService.js'
import { linkSaleToCustomerUser } from '../services/customerService.js'

const createSale = async (req, res, next) => {
  try {
    if (!req.user) return next({ status: 401, message: 'Not authenticated' })
    if (req.user.role === 'shopkeeper' && !req.user.shopId) return next({ status: 403, message: 'SHOP_REQUIRED' })

    const shopId = req.user.shopId || req.body.shopId
    const sellerId = req.user.role === 'seller' ? req.user.userId : null
    const { items, discount = 0, customerId } = req.body

    if (!items || items.length === 0) return next({ status: 400, message: 'Items are required' })

    const session = await mongoose.startSession()
    session.startTransaction()

    let result
    try {
      const productSnapshots = []
      for (const item of items) {
        const product = await Product.findById(item.productId).session(session)
        if (!product) throw { status: 404, message: `Product ${item.productId} not found` }
        if (req.user.role !== 'admin' && product.shopId.toString() !== shopId) throw { status: 403, message: 'Access denied to product' }
        if (product.stockQty < item.quantity) throw { status: 400, message: `Insufficient stock for ${product.name}: need ${item.quantity}, have ${product.stockQty}` }
        productSnapshots.push({ product, quantity: item.quantity })
      }

      const discountAmount = parseFloat(discount) || 0
      const saleItems = productSnapshots.map(({ product, quantity }) => ({
        productId: product._id,
        productName: product.name,
        productCategory: product.category,
        productUnit: product.unit,
        costPrice: product.costPrice,
        quantity,
        unitPrice: product.price,
        subtotal: product.price * quantity,
      }))
      const totalAmount = saleItems.reduce((sum, i) => sum + i.subtotal, 0) - discountAmount

      // Generate unique memo/feedback IDs
      const year = new Date().getFullYear()
      const count = await Sale.countDocuments({ shopId }).session(session)
      const memoId = `ZENO-${year}-${String(count + 1).padStart(4, '0')}`
      const feedbackToken = crypto.randomBytes(8).toString('hex')

      ;[result] = await Sale.create(
        [{ shopId, customerId: customerId || null, sellerId, totalAmount, discount: discountAmount, memoId, feedbackToken, items: saleItems }],
        { session }
      )

      for (const { product, quantity } of productSnapshots) {
        await Product.findByIdAndUpdate(product._id, { $inc: { stockQty: -quantity } }, { session })
        await StockMovement.create([{ productId: product._id, shopId, changeQty: -quantity, reason: `sale-${result._id}` }], { session })
      }

      await session.commitTransaction()
    } catch (err) {
      await session.abortTransaction()
      throw err
    } finally {
      session.endSession()
    }

    const populated = await Sale.findById(result._id)
      .populate('customerId', 'name phone email')
      .populate('sellerId', 'name')

    res.status(201).json({ success: true, data: populated })

    // Background: link customer user
    if (populated.customerId?.email) {
      linkSaleToCustomerUser(result._id, populated.customerId.email).catch((err) =>
        console.error('Failed to link customer user:', err.message)
      )
    }

    // Background: send memo email
    if (populated.customerId?.email && process.env.GMAIL_USER) {
      sendMemoEmail(populated)
        .then((sent) => {
          if (sent) Sale.findByIdAndUpdate(result._id, { emailSent: true }).exec()
        })
        .catch((err) => console.error('Background email send failed:', err.message))
    }
  } catch (err) {
    next(err)
  }
}

const getSales = async (req, res, next) => {
  try {
    if (!req.user) return next({ status: 401, message: 'Not authenticated' })

    const query = {}
    if (req.user.role !== 'admin') query.shopId = req.user.shopId

    if (req.query.date) {
      const day = new Date(req.query.date)
      const nextDay = new Date(day)
      nextDay.setDate(nextDay.getDate() + 1)
      query.createdAt = { $gte: day, $lt: nextDay }
    }

    if (req.query.customerId) query.customerId = req.query.customerId

    const sales = await Sale.find(query)
      .populate('customerId', 'id name')
      .select('-items -feedback -feedbackToken')
      .sort({ createdAt: -1 })

    res.status(200).json({ success: true, data: sales })
  } catch (err) {
    next(err)
  }
}

const getSaleById = async (req, res, next) => {
  try {
    if (!req.user) return next({ status: 401, message: 'Not authenticated' })

    const sale = await Sale.findById(req.params.id)
      .populate('customerId')
      .populate('sellerId', 'id name')

    if (!sale) return next({ status: 404, message: 'Sale not found' })
    if (req.user.role !== 'admin' && sale.shopId.toString() !== req.user.shopId) {
      return next({ status: 403, message: 'Access denied' })
    }

    res.status(200).json({ success: true, data: sale })
  } catch (err) {
    next(err)
  }
}

const getMemoPDF = async (req, res, next) => {
  try {
    if (!req.user) return next({ status: 401, message: 'Not authenticated' })

    const sale = await Sale.findById(req.params.id).populate('customerId')
    if (!sale) return next({ status: 404, message: 'Sale not found' })
    if (req.user.role !== 'admin' && sale.shopId.toString() !== req.user.shopId) {
      return next({ status: 403, message: 'Access denied' })
    }

    const pdfBuffer = await generateMemoPDF(sale, process.env.SHOP_NAME || 'ZENO')
    res.contentType('application/pdf')
    res.setHeader('Content-Disposition', `inline; filename="${sale.memoId}.pdf"`)
    res.send(pdfBuffer)
  } catch (err) {
    next(err)
  }
}

const resendMemoEmail = async (req, res, next) => {
  try {
    if (!req.user) return next({ status: 401, message: 'Not authenticated' })

    const sale = await Sale.findById(req.params.id).populate('customerId')
    if (!sale) return next({ status: 404, message: 'Sale not found' })
    if (req.user.role !== 'admin' && sale.shopId.toString() !== req.user.shopId) {
      return next({ status: 403, message: 'Access denied' })
    }
    if (!sale.customerId?.email) return next({ status: 400, message: 'Customer has no email address' })

    const sent = await sendMemoEmail(sale)
    if (sent) await Sale.findByIdAndUpdate(sale._id, { emailSent: true })

    res.status(200).json({ success: true, message: sent ? 'Memo email sent successfully' : 'Failed to send memo email' })
  } catch (err) {
    next(err)
  }
}

export { createSale, getSales, getSaleById, getMemoPDF, resendMemoEmail }
