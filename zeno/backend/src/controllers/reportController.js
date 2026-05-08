import Sale from '../models/Sale.js'
import Product from '../models/Product.js'
import Customer from '../models/Customer.js'
import PDFDocument from 'pdfkit'
import ExcelJS from 'exceljs'

const generatePDF = (title, headers, rows) =>
  new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument()
      const buffers = []
      doc.on('data', (c) => buffers.push(c))
      doc.on('end', () => resolve(Buffer.concat(buffers)))
      doc.on('error', reject)

      doc.fontSize(16).font('Helvetica-Bold').text(title, { align: 'center' })
      doc.moveDown()
      doc.fontSize(11).font('Helvetica')

      const colWidth = 550 / headers.length
      let x = doc.x
      const y = doc.y
      headers.forEach((h) => { doc.text(h, x, y, { width: colWidth, ellipsis: true }); x += colWidth })
      doc.moveDown()

      rows.forEach((row) => {
        x = doc.x
        const ry = doc.y
        row.forEach((cell) => {
          doc.text(cell !== null && cell !== undefined ? String(cell) : '', x, ry, { width: colWidth, ellipsis: true })
          x += colWidth
        })
        doc.moveDown()
      })
      doc.end()
    } catch (err) { reject(err) }
  })

const generateExcel = async (title, headers, rows) => {
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('Report')
  ws.addRow(headers)
  headers.forEach((_, i) => { ws.getColumn(i + 1).width = 20 })
  rows.forEach((r) => ws.addRow(r))
  return Buffer.from(await wb.xlsx.writeBuffer())
}

const getSalesReport = async (req, res, next) => {
  try {
    const { from, to, groupBy = 'day', format = 'json' } = req.query
    const match = {}
    if (from || to) {
      match.createdAt = {}
      if (from) match.createdAt.$gte = new Date(from)
      if (to) { const d = new Date(to); d.setDate(d.getDate() + 1); match.createdAt.$lt = d }
    }

    const sales = await Sale.find(match).select('createdAt totalAmount discount items').sort({ createdAt: 1 })

    const grouped = {}
    sales.forEach((sale) => {
      const date = new Date(sale.createdAt)
      let key
      if (groupBy === 'day') key = date.toISOString().split('T')[0]
      else if (groupBy === 'week') { const f = new Date(date); f.setDate(date.getDate() - date.getDay()); key = f.toISOString().split('T')[0] }
      else key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

      if (!grouped[key]) grouped[key] = { date: key, totalSales: 0, totalAmount: 0, totalDiscount: 0, itemCount: 0 }
      grouped[key].totalSales++
      grouped[key].totalAmount += Number(sale.totalAmount)
      grouped[key].totalDiscount += Number(sale.discount)
      grouped[key].itemCount += sale.items.length
    })

    const data = Object.values(grouped)
    if (format === 'json') return res.json({ success: true, data })

    const headers = ['Date', 'Total Sales', 'Total Amount', 'Total Discount', 'Item Count']
    const rows = data.map((r) => [r.date, r.totalSales, r.totalAmount.toFixed(2), r.totalDiscount.toFixed(2), r.itemCount])

    if (format === 'pdf') {
      const buf = await generatePDF('Sales Report', headers, rows)
      return res.contentType('application/pdf').setHeader('Content-Disposition', 'attachment; filename="sales-report.pdf"').send(buf)
    }
    if (format === 'xlsx') {
      const buf = await generateExcel('Sales Report', headers, rows)
      return res.contentType('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet').setHeader('Content-Disposition', 'attachment; filename="sales-report.xlsx"').send(buf)
    }
    res.status(400).json({ success: false, message: 'Invalid format' })
  } catch (err) { next(err) }
}

const getStockReport = async (req, res, next) => {
  try {
    const { format = 'json' } = req.query
    const products = await Product.find().sort({ name: 1 })

    const data = products.map((p) => ({
      id: p._id.toString(), name: p.name, category: p.category, unit: p.unit,
      price: p.price, costPrice: p.costPrice, stockQty: p.stockQty, minStock: p.minStock,
      status: p.stockQty <= p.minStock ? 'low' : 'ok',
    }))

    if (format === 'json') return res.json({ success: true, data })

    const headers = ['ID', 'Name', 'Category', 'Unit', 'Price', 'Cost Price', 'Stock', 'Min Stock', 'Status']
    const rows = data.map((r) => [r.id, r.name, r.category, r.unit, r.price.toFixed(2), r.costPrice.toFixed(2), r.stockQty, r.minStock, r.status])

    if (format === 'pdf') {
      const buf = await generatePDF('Stock Report', headers, rows)
      return res.contentType('application/pdf').setHeader('Content-Disposition', 'attachment; filename="stock-report.pdf"').send(buf)
    }
    if (format === 'xlsx') {
      const buf = await generateExcel('Stock Report', headers, rows)
      return res.contentType('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet').setHeader('Content-Disposition', 'attachment; filename="stock-report.xlsx"').send(buf)
    }
    res.status(400).json({ success: false, message: 'Invalid format' })
  } catch (err) { next(err) }
}

const getCustomersReport = async (req, res, next) => {
  try {
    const { format = 'json' } = req.query
    const customers = await Customer.find()

    const customerData = await Promise.all(
      customers.map(async (c) => {
        const sales = await Sale.find({ customerId: c._id }).select('totalAmount discount')
        const totalSpend = sales.reduce((sum, s) => sum + Number(s.totalAmount), 0)
        const totalDiscount = sales.reduce((sum, s) => sum + Number(s.discount), 0)
        return {
          id: c._id.toString(), name: c.name, phone: c.phone, email: c.email, tag: c.tag,
          salesCount: sales.length, totalSpend, totalDiscount,
          avgSpend: sales.length > 0 ? totalSpend / sales.length : 0,
        }
      })
    )

    const data = customerData.sort((a, b) => b.totalSpend - a.totalSpend).slice(0, 10)
    if (format === 'json') return res.json({ success: true, data })

    const headers = ['ID', 'Name', 'Phone', 'Email', 'Tag', 'Sales Count', 'Total Spend', 'Total Discount', 'Avg Spend']
    const rows = data.map((r) => [r.id, r.name, r.phone, r.email || '', r.tag, r.salesCount, r.totalSpend.toFixed(2), r.totalDiscount.toFixed(2), r.avgSpend.toFixed(2)])

    if (format === 'pdf') {
      const buf = await generatePDF('Top 10 Customers Report', headers, rows)
      return res.contentType('application/pdf').setHeader('Content-Disposition', 'attachment; filename="customers-report.pdf"').send(buf)
    }
    if (format === 'xlsx') {
      const buf = await generateExcel('Top 10 Customers Report', headers, rows)
      return res.contentType('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet').setHeader('Content-Disposition', 'attachment; filename="customers-report.xlsx"').send(buf)
    }
    res.status(400).json({ success: false, message: 'Invalid format' })
  } catch (err) { next(err) }
}

const getProfitReport = async (req, res, next) => {
  try {
    const { from, to, format = 'json' } = req.query
    const match = {}
    if (from || to) {
      match.createdAt = {}
      if (from) match.createdAt.$gte = new Date(from)
      if (to) { const d = new Date(to); d.setDate(d.getDate() + 1); match.createdAt.$lt = d }
    }

    const profitData = await Sale.aggregate([
      { $match: match },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productId',
          productName: { $first: '$items.productName' },
          costPrice: { $first: '$items.costPrice' },
          sellingPrice: { $first: '$items.unitPrice' },
          quantity: { $sum: '$items.quantity' },
          totalCost: { $sum: { $multiply: ['$items.costPrice', '$items.quantity'] } },
          totalRevenue: { $sum: '$items.subtotal' },
        },
      },
      {
        $project: {
          _id: 0, productId: { $toString: '$_id' },
          productName: 1, costPrice: 1, sellingPrice: 1, quantity: 1, totalCost: 1, totalRevenue: 1,
          totalProfit: { $subtract: ['$totalRevenue', '$totalCost'] },
        },
      },
      { $sort: { totalProfit: -1 } },
    ])

    const data = profitData.map((p) => ({
      ...p,
      profitMargin: p.totalRevenue > 0 ? ((p.totalProfit / p.totalRevenue) * 100).toFixed(2) : '0.00',
    }))

    if (format === 'json') return res.json({ success: true, data })

    const headers = ['Product ID', 'Product Name', 'Quantity', 'Cost Price', 'Selling Price', 'Total Cost', 'Total Revenue', 'Total Profit', 'Profit Margin %']
    const rows = data.map((r) => [r.productId, r.productName, r.quantity, r.costPrice?.toFixed(2), r.sellingPrice?.toFixed(2), r.totalCost.toFixed(2), r.totalRevenue.toFixed(2), r.totalProfit.toFixed(2), r.profitMargin])

    if (format === 'pdf') {
      const buf = await generatePDF('Profit Report', headers, rows)
      return res.contentType('application/pdf').setHeader('Content-Disposition', 'attachment; filename="profit-report.pdf"').send(buf)
    }
    if (format === 'xlsx') {
      const buf = await generateExcel('Profit Report', headers, rows)
      return res.contentType('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet').setHeader('Content-Disposition', 'attachment; filename="profit-report.xlsx"').send(buf)
    }
    res.status(400).json({ success: false, message: 'Invalid format' })
  } catch (err) { next(err) }
}

export { getSalesReport, getStockReport, getCustomersReport, getProfitReport }
