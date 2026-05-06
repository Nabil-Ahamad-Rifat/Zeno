import prisma from '../utils/prisma.js'
import PDFDocument from 'pdfkit'
import ExcelJS from 'exceljs'

const generatePDF = (title, headers, rows) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument()
      const buffers = []

      doc.on('data', (chunk) => buffers.push(chunk))
      doc.on('end', () => resolve(Buffer.concat(buffers)))
      doc.on('error', reject)

      doc.fontSize(16).font('Helvetica-Bold').text(title, { align: 'center' })
      doc.moveDown()
      doc.fontSize(11).font('Helvetica')

      // Table header
      const colWidth = 550 / headers.length
      let x = doc.x
      const y = doc.y
      headers.forEach((header) => {
        doc.text(header, x, y, { width: colWidth, ellipsis: true })
        x += colWidth
      })
      doc.moveDown()

      // Table rows
      rows.forEach((row) => {
        x = doc.x
        const rowY = doc.y
        row.forEach((cell, idx) => {
          const text = cell !== null && cell !== undefined ? String(cell) : ''
          doc.text(text, x, rowY, { width: colWidth, ellipsis: true })
          x += colWidth
        })
        doc.moveDown()
      })

      doc.end()
    } catch (err) {
      reject(err)
    }
  })
}

const generateExcel = async (title, headers, rows) => {
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('Report')

  worksheet.addRow(headers)
  headers.forEach((_, idx) => {
    worksheet.getColumn(idx + 1).width = 20
  })

  rows.forEach((row) => worksheet.addRow(row))

  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
}

const getSalesReport = async (req, res, next) => {
  try {
    const { from, to, groupBy = 'day', format = 'json' } = req.query

    const where = {}
    if (from || to) {
      where.createdAt = {}
      if (from) where.createdAt.gte = new Date(from)
      if (to) {
        const toDate = new Date(to)
        toDate.setDate(toDate.getDate() + 1)
        where.createdAt.lt = toDate
      }
    }

    const sales = await prisma.sale.findMany({
      where,
      include: {
        items: true,
        customer: { select: { name: true } },
      },
      orderBy: { createdAt: 'asc' },
    })

    let grouped = {}
    sales.forEach((sale) => {
      let key
      const date = new Date(sale.createdAt)

      if (groupBy === 'day') {
        key = date.toISOString().split('T')[0]
      } else if (groupBy === 'week') {
        const first = new Date(date)
        first.setDate(date.getDate() - date.getDay())
        key = first.toISOString().split('T')[0]
      } else if (groupBy === 'month') {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      }

      if (!grouped[key]) {
        grouped[key] = {
          date: key,
          totalSales: 0,
          totalAmount: 0,
          totalDiscount: 0,
          itemCount: 0,
        }
      }
      grouped[key].totalSales++
      grouped[key].totalAmount += Number(sale.totalAmount)
      grouped[key].totalDiscount += Number(sale.discount)
      grouped[key].itemCount += sale.items.length
    })

    const data = Object.values(grouped)

    if (format === 'json') {
      return res.json({ success: true, data })
    }

    const headers = ['Date', 'Total Sales', 'Total Amount', 'Total Discount', 'Item Count']
    const rows = data.map((row) => [
      row.date,
      row.totalSales,
      row.totalAmount.toFixed(2),
      row.totalDiscount.toFixed(2),
      row.itemCount,
    ])

    if (format === 'pdf') {
      const pdfBuffer = await generatePDF('Sales Report', headers, rows)
      res.contentType('application/pdf')
      res.setHeader('Content-Disposition', `attachment; filename="sales-report.pdf"`)
      return res.send(pdfBuffer)
    }

    if (format === 'xlsx') {
      const excelBuffer = await generateExcel('Sales Report', headers, rows)
      res.contentType('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      res.setHeader('Content-Disposition', `attachment; filename="sales-report.xlsx"`)
      return res.send(excelBuffer)
    }

    res.status(400).json({ success: false, message: 'Invalid format' })
  } catch (err) {
    next(err)
  }
}

const getStockReport = async (req, res, next) => {
  try {
    const { format = 'json' } = req.query

    const products = await prisma.product.findMany({
      orderBy: { name: 'asc' },
    })

    const data = products.map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      unit: p.unit,
      price: Number(p.price),
      costPrice: Number(p.costPrice),
      stockQty: p.stockQty,
      minStock: p.minStock,
      status: p.stockQty <= p.minStock ? 'low' : 'ok',
    }))

    if (format === 'json') {
      return res.json({ success: true, data })
    }

    const headers = ['ID', 'Name', 'Category', 'Unit', 'Price', 'Cost Price', 'Stock', 'Min Stock', 'Status']
    const rows = data.map((row) => [
      row.id,
      row.name,
      row.category,
      row.unit,
      row.price.toFixed(2),
      row.costPrice.toFixed(2),
      row.stockQty,
      row.minStock,
      row.status,
    ])

    if (format === 'pdf') {
      const pdfBuffer = await generatePDF('Stock Report', headers, rows)
      res.contentType('application/pdf')
      res.setHeader('Content-Disposition', `attachment; filename="stock-report.pdf"`)
      return res.send(pdfBuffer)
    }

    if (format === 'xlsx') {
      const excelBuffer = await generateExcel('Stock Report', headers, rows)
      res.contentType('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      res.setHeader('Content-Disposition', `attachment; filename="stock-report.xlsx"`)
      return res.send(excelBuffer)
    }

    res.status(400).json({ success: false, message: 'Invalid format' })
  } catch (err) {
    next(err)
  }
}

const getCustomersReport = async (req, res, next) => {
  try {
    const { format = 'json' } = req.query

    const customers = await prisma.customer.findMany({
      include: {
        sales: {
          select: { totalAmount: true, discount: true },
        },
      },
    })

    const customerData = customers
      .map((c) => {
        const totalSpend = c.sales.reduce((sum, s) => sum + Number(s.totalAmount), 0)
        const totalDiscount = c.sales.reduce((sum, s) => sum + Number(s.discount), 0)
        return {
          id: c.id,
          name: c.name,
          phone: c.phone,
          email: c.email,
          tag: c.tag,
          salesCount: c.sales.length,
          totalSpend,
          totalDiscount,
          avgSpend: c.sales.length > 0 ? totalSpend / c.sales.length : 0,
        }
      })
      .sort((a, b) => b.totalSpend - a.totalSpend)
      .slice(0, 10)

    if (format === 'json') {
      return res.json({ success: true, data: customerData })
    }

    const headers = ['ID', 'Name', 'Phone', 'Email', 'Tag', 'Sales Count', 'Total Spend', 'Total Discount', 'Avg Spend']
    const rows = customerData.map((row) => [
      row.id,
      row.name,
      row.phone,
      row.email || '',
      row.tag,
      row.salesCount,
      row.totalSpend.toFixed(2),
      row.totalDiscount.toFixed(2),
      row.avgSpend.toFixed(2),
    ])

    if (format === 'pdf') {
      const pdfBuffer = await generatePDF('Top 10 Customers Report', headers, rows)
      res.contentType('application/pdf')
      res.setHeader('Content-Disposition', `attachment; filename="customers-report.pdf"`)
      return res.send(pdfBuffer)
    }

    if (format === 'xlsx') {
      const excelBuffer = await generateExcel('Top 10 Customers Report', headers, rows)
      res.contentType('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      res.setHeader('Content-Disposition', `attachment; filename="customers-report.xlsx"`)
      return res.send(excelBuffer)
    }

    res.status(400).json({ success: false, message: 'Invalid format' })
  } catch (err) {
    next(err)
  }
}

const getProfitReport = async (req, res, next) => {
  try {
    const { from, to, format = 'json' } = req.query

    const where = {}
    if (from || to) {
      where.createdAt = {}
      if (from) where.createdAt.gte = new Date(from)
      if (to) {
        const toDate = new Date(to)
        toDate.setDate(toDate.getDate() + 1)
        where.createdAt.lt = toDate
      }
    }

    const saleItems = await prisma.saleItem.findMany({
      where: {
        sale: where,
      },
      include: {
        product: { select: { id: true, name: true, costPrice: true } },
        sale: { select: { createdAt: true } },
      },
    })

    const profitByProduct = {}
    saleItems.forEach((item) => {
      if (!profitByProduct[item.productId]) {
        profitByProduct[item.productId] = {
          productId: item.productId,
          productName: item.product.name,
          quantity: 0,
          costPrice: Number(item.product.costPrice),
          sellingPrice: Number(item.unitPrice),
          totalCost: 0,
          totalRevenue: 0,
          totalProfit: 0,
        }
      }

      const p = profitByProduct[item.productId]
      const itemCost = Number(item.product.costPrice) * item.quantity
      const itemRevenue = Number(item.subtotal)
      const itemProfit = itemRevenue - itemCost

      p.quantity += item.quantity
      p.totalCost += itemCost
      p.totalRevenue += itemRevenue
      p.totalProfit += itemProfit
    })

    const data = Object.values(profitByProduct)
      .map((p) => ({
        ...p,
        profitMargin: p.totalRevenue > 0 ? ((p.totalProfit / p.totalRevenue) * 100).toFixed(2) : 0,
      }))
      .sort((a, b) => b.totalProfit - a.totalProfit)

    if (format === 'json') {
      return res.json({ success: true, data })
    }

    const headers = ['Product ID', 'Product Name', 'Quantity', 'Cost Price', 'Selling Price', 'Total Cost', 'Total Revenue', 'Total Profit', 'Profit Margin %']
    const rows = data.map((row) => [
      row.productId,
      row.productName,
      row.quantity,
      row.costPrice.toFixed(2),
      row.sellingPrice.toFixed(2),
      row.totalCost.toFixed(2),
      row.totalRevenue.toFixed(2),
      row.totalProfit.toFixed(2),
      row.profitMargin,
    ])

    if (format === 'pdf') {
      const pdfBuffer = await generatePDF('Profit Report', headers, rows)
      res.contentType('application/pdf')
      res.setHeader('Content-Disposition', `attachment; filename="profit-report.pdf"`)
      return res.send(pdfBuffer)
    }

    if (format === 'xlsx') {
      const excelBuffer = await generateExcel('Profit Report', headers, rows)
      res.contentType('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      res.setHeader('Content-Disposition', `attachment; filename="profit-report.xlsx"`)
      return res.send(excelBuffer)
    }

    res.status(400).json({ success: false, message: 'Invalid format' })
  } catch (err) {
    next(err)
  }
}

export { getSalesReport, getStockReport, getCustomersReport, getProfitReport }
