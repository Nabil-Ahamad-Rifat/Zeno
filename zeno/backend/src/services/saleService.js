import mongoose from 'mongoose'
import crypto from 'crypto'
import Sale from '../models/Sale.js'
import Product from '../models/Product.js'
import StockMovement from '../models/StockMovement.js'

const generateMemoId = async (shopId) => {
  const year = new Date().getFullYear()
  const lastSale = await Sale.findOne(
    { shopId, memoId: { $regex: `^ZENO-${year}-` } },
    { memoId: 1 }
  ).sort({ memoId: -1 })

  let number = 1
  if (lastSale) {
    const match = lastSale.memoId.match(/ZENO-\d+-(\d+)/)
    if (match) number = parseInt(match[1], 10) + 1
  }

  return `ZENO-${year}-${String(number).padStart(4, '0')}`
}

const generateFeedbackToken = () => crypto.randomBytes(16).toString('hex')

export const createSale = async (shopId, userId, data) => {
  const { customerId, items, discount = 0 } = data

  if (!items || items.length === 0) throw new Error('ITEMS_REQUIRED')

  const session = await mongoose.startSession()
  session.startTransaction()

  try {
    const productIds = items.map((item) => item.product_id)
    const products = await Product.find({ _id: { $in: productIds }, shopId }).session(session)

    if (products.length !== items.length) throw new Error('PRODUCT_NOT_FOUND')

    let totalAmount = 0
    const saleItems = []

    for (const item of items) {
      const product = products.find((p) => p._id.toString() === item.product_id.toString())
      if (!product) throw new Error('PRODUCT_NOT_FOUND')
      if (product.stockQty < item.quantity) throw new Error('INSUFFICIENT_STOCK')

      const subtotal = product.price * item.quantity
      totalAmount += subtotal

      saleItems.push({
        productId: product._id,
        productName: product.name,
        productCategory: product.category,
        productUnit: product.unit,
        costPrice: product.costPrice,
        quantity: item.quantity,
        unitPrice: product.price,
        subtotal,
      })
    }

    const discountAmount = parseFloat(discount) || 0
    const finalTotal = Math.max(0, totalAmount - discountAmount)
    const memoId = await generateMemoId(shopId)
    const feedbackToken = generateFeedbackToken()

    const [sale] = await Sale.create(
      [
        {
          shopId,
          customerId: customerId || null,
          sellerId: userId,
          totalAmount: finalTotal,
          discount: discountAmount,
          memoId,
          feedbackToken,
          emailSent: false,
          items: saleItems,
        },
      ],
      { session }
    )

    // Deduct stock and record movements
    for (const item of saleItems) {
      await Product.findByIdAndUpdate(
        item.productId,
        { $inc: { stockQty: -item.quantity } },
        { session }
      )
      await StockMovement.create(
        [{ productId: item.productId, shopId, changeQty: -item.quantity, reason: `sale-${sale._id}` }],
        { session }
      )
    }

    await session.commitTransaction()

    return Sale.findById(sale._id)
      .populate('customerId', 'id name phone')
      .populate('sellerId', 'id name')
  } catch (err) {
    await session.abortTransaction()
    throw err
  } finally {
    session.endSession()
  }
}

export const getSales = async (shopId, filters = {}) => {
  const { search, customerId, sellerId, dateFrom, dateTo, page = 1, limit = 20 } = filters
  const query = { shopId }

  if (customerId) query.customerId = customerId
  if (sellerId) query.sellerId = sellerId

  if (search) {
    query.$or = [{ memoId: { $regex: search, $options: 'i' } }]
  }

  if (dateFrom || dateTo) {
    query.createdAt = {}
    if (dateFrom) query.createdAt.$gte = new Date(dateFrom)
    if (dateTo) {
      const date = new Date(dateTo)
      date.setHours(23, 59, 59, 999)
      query.createdAt.$lte = date
    }
  }

  const skip = (page - 1) * limit

  const [sales, total] = await Promise.all([
    Sale.find(query)
      .populate('customerId', 'id name phone')
      .populate('sellerId', 'id name')
      .select('-items -feedback -feedbackToken')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Sale.countDocuments(query),
  ])

  return { sales, total, pages: Math.ceil(total / limit), currentPage: page }
}

export const getSaleById = (shopId, saleId) =>
  Sale.findOne({ _id: saleId, shopId })
    .populate('customerId', 'id name phone email')
    .populate('sellerId', 'id name')

export const getSalesBySeller = (shopId, sellerId) =>
  Sale.find({ shopId, sellerId })
    .populate('customerId', 'id name')
    .sort({ createdAt: -1 })
    .limit(10)
