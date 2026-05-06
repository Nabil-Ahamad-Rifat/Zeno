import PDFDocument from 'pdfkit'

export const generateMemoPDF = async (sale, shopName) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 40,
    })

    const chunks = []
    doc.on('data', (chunk) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    // Header
    doc.fontSize(24).font('Helvetica-Bold').text(shopName, { align: 'center' })
    doc.moveDown(0.3)
    doc.fontSize(10).font('Helvetica').text('Sales Invoice', { align: 'center' })
    doc.moveDown(1)

    // Memo ID and Date
    doc.fontSize(10)
    doc.text(`Memo ID: ${sale.memoId}`, 40, doc.y)
    doc.text(`Date: ${new Date(sale.createdAt).toLocaleDateString()}`, 40, doc.y)
    doc.text(`Time: ${new Date(sale.createdAt).toLocaleTimeString()}`, 40, doc.y)
    doc.moveDown(0.5)

    // Customer Info
    doc.font('Helvetica-Bold').fontSize(10).text('Customer Information')
    doc.font('Helvetica').fontSize(9)
    if (sale.customer) {
      doc.text(`Name: ${sale.customer.name}`)
      doc.text(`Phone: ${sale.customer.phone}`)
      if (sale.customer.email) doc.text(`Email: ${sale.customer.email}`)
    } else {
      doc.text('Name: Walk-in Customer')
    }
    doc.moveDown(1)

    // Items Table
    doc.font('Helvetica-Bold').fontSize(10).text('Items')
    doc.moveDown(0.3)

    const tableTop = doc.y
    const col1 = 50
    const col2 = 250
    const col3 = 320
    const col4 = 380
    const col5 = 480

    // Table Headers
    doc.font('Helvetica-Bold').fontSize(9)
    doc.text('Product', col1, tableTop)
    doc.text('Unit', col2, tableTop)
    doc.text('Qty', col3, tableTop)
    doc.text('Price', col4, tableTop)
    doc.text('Subtotal', col5, tableTop)

    // Separator line
    doc.moveTo(40, tableTop + 15).lineTo(560, tableTop + 15).stroke()
    doc.moveDown(0.8)

    // Table Data
    doc.font('Helvetica').fontSize(9)
    sale.items.forEach((item) => {
      const y = doc.y
      doc.text(item.product.name, col1, y, { width: 190 })
      doc.text(item.product.unit, col2, y)
      doc.text(item.quantity.toString(), col3, y)
      doc.text(`৳${Number(item.unitPrice).toFixed(2)}`, col4, y)
      doc.text(`৳${Number(item.subtotal).toFixed(2)}`, col5, y)
      doc.moveDown(0.6)
    })

    // Separator line
    doc.moveTo(40, doc.y).lineTo(560, doc.y).stroke()
    doc.moveDown(0.5)

    // Totals
    doc.font('Helvetica').fontSize(10)
    const subtotal = sale.items.reduce(
      (sum, item) => sum + Number(item.subtotal),
      0
    )
    doc.text(`Subtotal: ৳${subtotal.toFixed(2)}`, col4, doc.y, { align: 'right', width: 80 })
    doc.moveDown(0.4)

    if (Number(sale.discount) > 0) {
      doc.text(`Discount: -৳${Number(sale.discount).toFixed(2)}`, col4, doc.y, { align: 'right', width: 80 })
      doc.moveDown(0.4)
    }

    doc.font('Helvetica-Bold').fontSize(11)
    doc.text(`Total: ৳${Number(sale.totalAmount).toFixed(2)}`, col4, doc.y, { align: 'right', width: 80 })
    doc.moveDown(2)

    // Feedback section
    doc.font('Helvetica').fontSize(9).text('Thank you for your business!', { align: 'center' })
    if (sale.feedbackToken) {
      doc.fontSize(8).fillColor('#0066CC')
      doc.text(`Feedback: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/feedback/${sale.feedbackToken}`, {
        align: 'center',
        underline: true,
      })
    }

    doc.end()
  })
}
