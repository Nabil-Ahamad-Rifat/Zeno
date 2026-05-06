import crypto from 'crypto'
import prisma from '../utils/prisma.js'
import { sendMemoEmail } from '../services/emailService.js'
import { generateMemoPDF } from '../services/memoService.js'

const createSale = async (req, res, next) => {
  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Validate stock for every item sequentially
      const productSnapshots = []
      for (const item of req.body.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        })
        if (!product) {
          throw {
            status: 404,
            message: `Product with id ${item.productId} not found`,
          }
        }
        if (product.stockQty < item.quantity) {
          throw {
            status: 400,
            message: `Insufficient stock for ${product.name}: need ${item.quantity}, have ${product.stockQty}`,
          }
        }
        productSnapshots.push({ product, quantity: item.quantity })
      }

      // 2. Calculate financials
      const discount = req.body.discount ?? 0
      const itemsData = productSnapshots.map(({ product, quantity }) => ({
        productId: product.id,
        quantity,
        unitPrice: product.price,
        subtotal: parseFloat(product.price) * quantity,
      }))
      const totalAmount = itemsData.reduce((sum, i) => sum + i.subtotal, 0) - discount

      // 3. Create Sale with temp unique placeholders
      const tempId = crypto.randomUUID()
      const sale = await tx.sale.create({
        data: {
          customerId: req.body.customerId ?? null,
          totalAmount,
          discount,
          memoId: `TEMP-${tempId}`,
          feedbackToken: `TEMP-${tempId}-fb`,
        },
      })

      // 4. Update with final memoId + feedbackToken
      const year = new Date().getFullYear()
      const memoId = `ASTRA-${year}-${String(sale.id).padStart(4, '0')}`
      const feedbackToken = crypto.randomBytes(8).toString('hex')
      await tx.sale.update({
        where: { id: sale.id },
        data: { memoId, feedbackToken },
      })

      // 5. Create SaleItems
      for (const item of itemsData) {
        await tx.saleItem.create({
          data: {
            saleId: sale.id,
            ...item,
          },
        })
      }

      // 6. Decrement stock + log StockMovement
      for (const { product, quantity } of productSnapshots) {
        await tx.product.update({
          where: { id: product.id },
          data: { stockQty: { decrement: quantity } },
        })
        await tx.stockMovement.create({
          data: {
            productId: product.id,
            changeQty: -quantity,
            reason: 'sale',
          },
        })
      }

      // 7. Return full sale
      return tx.sale.findUnique({
        where: { id: sale.id },
        include: {
          customer: true,
          items: {
            include: { product: true },
          },
        },
      })
    })

    res.status(201).json({
      success: true,
      data: JSON.parse(JSON.stringify(result)),
    })

    // Send memo email in background (don't block response)
    if (result.customer && result.customer.email && process.env.GMAIL_USER) {
      sendMemoEmail(result)
        .then((sent) => {
          if (sent) {
            prisma.sale.update({
              where: { id: result.id },
              data: { emailSent: true },
            }).catch(err => console.error('Failed to update emailSent flag:', err))
          }
        })
        .catch((err) => {
          console.error('Background email send failed:', err.message)
        })
    }
  } catch (err) {
    next(err)
  }
}

const getSales = async (req, res, next) => {
  try {
    const where = {}

    if (req.query.date) {
      const day = new Date(req.query.date)
      const nextDay = new Date(day)
      nextDay.setDate(nextDay.getDate() + 1)
      where.createdAt = { gte: day, lt: nextDay }
    }

    if (req.query.customerId) {
      where.customerId = parseInt(req.query.customerId, 10)
    }

    const sales = await prisma.sale.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true } },
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    res.status(200).json({
      success: true,
      data: JSON.parse(JSON.stringify(sales)),
    })
  } catch (err) {
    next(err)
  }
}

const getSaleById = async (req, res, next) => {
  try {
    const sale = await prisma.sale.findUnique({
      where: { id: parseInt(req.params.id, 10) },
      include: {
        customer: true,
        items: {
          include: {
            product: { select: { id: true, name: true, unit: true } },
          },
        },
        feedback: true,
      },
    })

    if (!sale) {
      return next({
        status: 404,
        message: 'Sale not found',
      })
    }

    res.status(200).json({
      success: true,
      data: JSON.parse(JSON.stringify(sale)),
    })
  } catch (err) {
    next(err)
  }
}

const getMemoPDF = async (req, res, next) => {
  try {
    const sale = await prisma.sale.findUnique({
      where: { id: parseInt(req.params.id, 10) },
      include: {
        customer: true,
        items: {
          include: {
            product: { select: { id: true, name: true, unit: true } },
          },
        },
      },
    })

    if (!sale) {
      return next({
        status: 404,
        message: 'Sale not found',
      })
    }

    const pdfBuffer = await generateMemoPDF(sale, process.env.SHOP_NAME || 'ASTRA')

    res.contentType('application/pdf')
    res.setHeader('Content-Disposition', `inline; filename="${sale.memoId}.pdf"`)
    res.send(pdfBuffer)
  } catch (err) {
    next(err)
  }
}

const resendMemoEmail = async (req, res, next) => {
  try {
    const sale = await prisma.sale.findUnique({
      where: { id: parseInt(req.params.id, 10) },
      include: {
        customer: true,
        items: {
          include: {
            product: { select: { id: true, name: true, unit: true } },
          },
        },
      },
    })

    if (!sale) {
      return next({
        status: 404,
        message: 'Sale not found',
      })
    }

    if (!sale.customer || !sale.customer.email) {
      return next({
        status: 400,
        message: 'Customer has no email address',
      })
    }

    const sent = await sendMemoEmail(sale)

    if (sent) {
      await prisma.sale.update({
        where: { id: sale.id },
        data: { emailSent: true },
      })
    }

    res.status(200).json({
      success: true,
      message: sent ? 'Memo email sent successfully' : 'Failed to send memo email',
    })
  } catch (err) {
    next(err)
  }
}

export { createSale, getSales, getSaleById, getMemoPDF, resendMemoEmail }
