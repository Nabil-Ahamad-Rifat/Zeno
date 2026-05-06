import nodemailer from 'nodemailer'
import { generateMemoPDF } from './memoService.js'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
})

export const sendMemoEmail = async (sale) => {
  try {
    // Only send if customer has email
    if (!sale.customer || !sale.customer.email) {
      console.log(`[Email] Skipping email for sale ${sale.memoId} - no customer email`)
      return false
    }

    // Generate PDF
    const pdfBuffer = await generateMemoPDF(sale, process.env.SHOP_NAME || 'ASTRA')

    // Construct feedback link
    const feedbackLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/feedback/${sale.feedbackToken}`

    // Email template
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333; text-align: center;">${process.env.SHOP_NAME || 'ASTRA'}</h1>
        <p style="text-align: center; color: #666;">Thank you for your purchase!</p>

        <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="margin-top: 0; color: #333;">Memo Details</h2>
          <p><strong>Memo ID:</strong> ${sale.memoId}</p>
          <p><strong>Date:</strong> ${new Date(sale.createdAt).toLocaleDateString()}</p>
          <p><strong>Total Amount:</strong> ৳${Number(sale.totalAmount).toFixed(2)}</p>
        </div>

        <h3 style="color: #333;">Items Purchased</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tr style="background: #f0f0f0; border-bottom: 2px solid #ddd;">
            <th style="padding: 10px; text-align: left;">Product</th>
            <th style="padding: 10px; text-align: center;">Qty</th>
            <th style="padding: 10px; text-align: right;">Price</th>
            <th style="padding: 10px; text-align: right;">Subtotal</th>
          </tr>
          ${sale.items
            .map(
              (item) => `
            <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 10px;">${item.product.name}</td>
              <td style="padding: 10px; text-align: center;">${item.quantity}</td>
              <td style="padding: 10px; text-align: right;">৳${Number(item.unitPrice).toFixed(2)}</td>
              <td style="padding: 10px; text-align: right;">৳${Number(item.subtotal).toFixed(2)}</td>
            </tr>
          `
            )
            .join('')}
        </table>

        <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Subtotal:</strong> ৳${sale.items.reduce((sum, item) => sum + Number(item.subtotal), 0).toFixed(2)}</p>
          ${Number(sale.discount) > 0 ? `<p style="margin: 5px 0; color: #d32f2f;"><strong>Discount:</strong> -৳${Number(sale.discount).toFixed(2)}</p>` : ''}
          <p style="margin: 5px 0; font-size: 18px;"><strong>Total: ৳${Number(sale.totalAmount).toFixed(2)}</strong></p>
        </div>

        <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
          <p style="margin: 0 0 10px 0; color: #333;"><strong>Share Your Feedback</strong></p>
          <a href="${feedbackLink}" style="display: inline-block; background: #0066CC; color: white; padding: 10px 20px; border-radius: 4px; text-decoration: none; font-weight: bold;">Rate Your Experience</a>
        </div>

        <p style="color: #999; font-size: 12px; text-align: center; margin-top: 30px;">
          Thank you for shopping with us!<br/>
          ${process.env.SHOP_NAME || 'ASTRA'} - ${process.env.SHOP_EMAIL || 'shop@example.com'}
        </p>
      </div>
    `

    // Send email
    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: sale.customer.email,
      subject: `Your Purchase Receipt - ${sale.memoId}`,
      html: htmlContent,
      attachments: [
        {
          filename: `${sale.memoId}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    })

    console.log(`[Email] Sent memo email to ${sale.customer.email} for sale ${sale.memoId}`)
    return true
  } catch (error) {
    console.error(`[Email] Failed to send memo email for sale ${sale.memoId}:`, error.message)
    return false
  }
}
