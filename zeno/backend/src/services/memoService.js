import PDFDocument from 'pdfkit'

const formatCurrency = (value) => `৳${Number(value).toFixed(2)}`

const drawTableRow = (doc, data, widths, startX, y, isHeader = false) => {
  const font = isHeader ? 'Helvetica-Bold' : 'Helvetica'
  const fontSize = isHeader ? 9 : 8
  doc.font(font).fontSize(fontSize)

  let xPos = startX
  data.forEach((cell, idx) => {
    const width = widths[idx]
    const align = idx === 0 ? 'left' : idx > 1 ? 'right' : 'center'
    doc.text(String(cell), xPos, y, { width, align, height: 30, valign: 'center' })
    xPos += width
  })
}

export const generateMemoPDF = async (sale, shopName) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 30,
      bufferPages: true,
    })

    const chunks = []
    doc.on('data', (chunk) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    const pageWidth = doc.page.width
    const leftMargin = 30
    const rightMargin = 30
    const contentWidth = pageWidth - leftMargin - rightMargin

    // Header
    doc.fontSize(20).font('Helvetica-Bold').text(shopName, { align: 'center' })
    doc.fontSize(9).font('Helvetica').text('Sales Invoice / Memo', { align: 'center' })
    doc.moveTo(leftMargin, doc.y).lineTo(pageWidth - rightMargin, doc.y).stroke()
    doc.moveDown(0.5)

    // Two-column layout: Memo Info | Customer Info
    const col1X = leftMargin
    const col2X = leftMargin + contentWidth / 2

    doc.fontSize(9).font('Helvetica-Bold').text('Memo Information', col1X, doc.y, { width: contentWidth / 2 - 10 })
    doc.fontSize(9).font('Helvetica-Bold').text('Customer Information', col2X, doc.y, { width: contentWidth / 2 - 10 })

    const memoInfoY = doc.y
    doc.fontSize(8).font('Helvetica')

    doc.text(`ID: ${sale.memoId}`, col1X, memoInfoY, { width: contentWidth / 2 - 10 })
    doc.text(`Date: ${new Date(sale.createdAt).toLocaleDateString('en-GB')}`, col1X, doc.y, { width: contentWidth / 2 - 10 })
    doc.text(`Time: ${new Date(sale.createdAt).toLocaleTimeString()}`, col1X, doc.y, { width: contentWidth / 2 - 10 })

    const customerY = memoInfoY
    if (sale.customer) {
      doc.text(`Name: ${sale.customer.name}`, col2X, customerY, { width: contentWidth / 2 - 10 })
      doc.text(`Phone: ${sale.customer.phone}`, col2X, doc.y, { width: contentWidth / 2 - 10 })
      if (sale.customer.email) {
        doc.text(`Email: ${sale.customer.email}`, col2X, doc.y, { width: contentWidth / 2 - 10 })
      }
    } else {
      doc.text('Name: Walk-in Customer', col2X, customerY, { width: contentWidth / 2 - 10 })
    }

    doc.moveDown(1)
    doc.moveTo(leftMargin, doc.y).lineTo(pageWidth - rightMargin, doc.y).stroke()
    doc.moveDown(0.5)

    // Items Table
    const tableTop = doc.y
    const tableX = leftMargin
    const colWidths = [contentWidth * 0.4, contentWidth * 0.15, contentWidth * 0.15, contentWidth * 0.15, contentWidth * 0.15]

    // Table Header
    doc.font('Helvetica-Bold').fontSize(9).fillColor('#000')
    drawTableRow(
      doc,
      ['Product', 'Unit', 'Qty', 'Unit Price', 'Subtotal'],
      colWidths,
      tableX,
      doc.y,
      true
    )

    doc.moveTo(tableX, doc.y - 5).lineTo(pageWidth - rightMargin, doc.y - 5).stroke()
    doc.moveDown(0.8)

    // Table Rows
    doc.font('Helvetica').fontSize(8)
    sale.items.forEach((item) => {
      const rowY = doc.y
      const productName = String(item.product.name).substring(0, 40)
      doc.text(productName, tableX, rowY, { width: colWidths[0], height: 25, valign: 'center' })
      doc.text(String(item.product.unit), tableX + colWidths[0], rowY, {
        width: colWidths[1],
        align: 'center',
        height: 25,
        valign: 'center',
      })
      doc.text(String(item.quantity), tableX + colWidths[0] + colWidths[1], rowY, {
        width: colWidths[2],
        align: 'center',
        height: 25,
        valign: 'center',
      })
      doc.text(formatCurrency(item.unitPrice), tableX + colWidths[0] + colWidths[1] + colWidths[2], rowY, {
        width: colWidths[3],
        align: 'right',
        height: 25,
        valign: 'center',
      })
      doc.text(formatCurrency(item.subtotal), tableX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], rowY, {
        width: colWidths[4],
        align: 'right',
        height: 25,
        valign: 'center',
      })
      doc.moveDown(1.5)
    })

    // Total Section
    doc.moveTo(tableX, doc.y).lineTo(pageWidth - rightMargin, doc.y).stroke()
    doc.moveDown(0.3)

    const subtotal = sale.items.reduce((sum, item) => sum + Number(item.subtotal), 0)
    const totalX = tableX + colWidths[0] + colWidths[1] + colWidths[2]

    doc.font('Helvetica').fontSize(9)
    doc.text('Subtotal:', totalX, doc.y, { width: colWidths[3], align: 'right' })
    doc.text(formatCurrency(subtotal), totalX + colWidths[3], doc.y, { width: colWidths[4], align: 'right' })
    doc.moveDown(0.4)

    if (Number(sale.discount) > 0) {
      doc.fillColor('#d32f2f')
      doc.text('Discount:', totalX, doc.y, { width: colWidths[3], align: 'right' })
      doc.text(`-${formatCurrency(sale.discount)}`, totalX + colWidths[3], doc.y, {
        width: colWidths[4],
        align: 'right',
      })
      doc.fillColor('#000')
      doc.moveDown(0.4)
    }

    doc.font('Helvetica-Bold').fontSize(11)
    doc.text('TOTAL:', totalX, doc.y, { width: colWidths[3], align: 'right' })
    doc.text(formatCurrency(sale.totalAmount), totalX + colWidths[3], doc.y, {
      width: colWidths[4],
      align: 'right',
    })
    doc.moveDown(1.5)

    // Footer
    doc.moveTo(leftMargin, doc.y).lineTo(pageWidth - rightMargin, doc.y).stroke()
    doc.moveDown(0.5)

    doc.font('Helvetica').fontSize(8).fillColor('#666')
    doc.text('Thank you for your business!', { align: 'center' })

    if (sale.feedbackToken) {
      doc.fillColor('#0066CC').fontSize(7)
      doc.text(
        `Feedback: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/feedback/${sale.feedbackToken}`,
        { align: 'center', link: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/feedback/${sale.feedbackToken}` }
      )
    }

    doc.moveDown(0.3)
    doc.fillColor('#999').fontSize(7)
    doc.text(`Generated on ${new Date().toLocaleString('en-GB')}`, { align: 'center' })

    doc.end()
  })
}
