import nodemailer from 'nodemailer'
import { generateMemoPDF } from './memoService.js'
import Shop from '../models/Shop.js'

let transporter = null

const getTransporter = () => {
  if (!transporter && process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    })
  }
  return transporter
}

export const sendMemoEmail = async (sale) => {
  try {
    const mailer = getTransporter()
    if (!mailer) {
      console.log(`[Email] Skipping email for sale ${sale.memoId} - Gmail credentials not configured`)
      return false
    }

    // Only send if customer has email
    if (!sale.customerId || !sale.customerId.email) {
      console.log(`[Email] Skipping email for sale ${sale.memoId} - no customer email`)
      return false
    }

    // Generate PDF
    const pdfBuffer = await generateMemoPDF(sale, process.env.SHOP_NAME || 'ZENO')

    // Construct feedback link
    const feedbackLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/feedback/${sale.feedbackToken}`
    const saleDate = new Date(sale.createdAt).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })

    // Calculate subtotal and discount
    const subtotal = sale.items.reduce((sum, item) => sum + Number(item.subtotal), 0)
    const discount = Number(sale.discount) || 0
    const total = Number(sale.totalAmount)

    // Email template with professional styling
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 20px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 28px; font-weight: bold;">${process.env.SHOP_NAME || 'ZENO'}</h1>
            <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">Purchase Receipt</p>
          </div>

          <!-- Main Content -->
          <div style="padding: 30px 20px;">
            <!-- Thank You Message -->
            <h2 style="margin: 0 0 20px 0; color: #333; font-size: 20px; text-align: center;">
              Thank you for your purchase!
            </h2>

            <!-- Memo Details -->
            <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #667eea;">
              <table style="width: 100%;">
                <tr>
                  <td style="padding: 8px 0; color: #666; font-size: 14px;">
                    <strong>Memo ID:</strong>
                  </td>
                  <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right;">
                    ${sale.memoId}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666; font-size: 14px;">
                    <strong>Date:</strong>
                  </td>
                  <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right;">
                    ${saleDate}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666; font-size: 14px;">
                    <strong>Customer:</strong>
                  </td>
                  <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right;">
                    ${sale.customerId?.name || 'Walk-in Customer'}
                  </td>
                </tr>
              </table>
            </div>

            <!-- Items Table -->
            <h3 style="margin: 20px 0 10px 0; color: #333; font-size: 16px;">Order Details</h3>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              <thead>
                <tr style="background-color: #f0f0f0; border-bottom: 2px solid #ddd;">
                  <th style="padding: 12px 8px; text-align: left; color: #333; font-weight: 600; font-size: 13px;">Product</th>
                  <th style="padding: 12px 8px; text-align: center; color: #333; font-weight: 600; font-size: 13px;">Qty</th>
                  <th style="padding: 12px 8px; text-align: right; color: #333; font-weight: 600; font-size: 13px;">Price</th>
                  <th style="padding: 12px 8px; text-align: right; color: #333; font-weight: 600; font-size: 13px;">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${sale.items
                  .map(
                    (item) => `
                  <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 12px 8px; color: #333; font-size: 13px;">${item.productName}</td>
                    <td style="padding: 12px 8px; text-align: center; color: #333; font-size: 13px;">${item.quantity}</td>
                    <td style="padding: 12px 8px; text-align: right; color: #333; font-size: 13px;">৳${Number(item.unitPrice).toFixed(2)}</td>
                    <td style="padding: 12px 8px; text-align: right; color: #333; font-size: 13px; font-weight: 500;">৳${Number(item.subtotal).toFixed(2)}</td>
                  </tr>
                `
                  )
                  .join('')}
              </tbody>
            </table>

            <!-- Summary Section -->
            <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <table style="width: 100%; font-size: 14px;">
                <tr>
                  <td style="padding: 8px 0; color: #666; text-align: right;">Subtotal:</td>
                  <td style="padding: 8px 0; color: #333; text-align: right; font-weight: 500; width: 120px;">৳${subtotal.toFixed(2)}</td>
                </tr>
                ${discount > 0 ? `
                <tr>
                  <td style="padding: 8px 0; color: #d32f2f; text-align: right;">Discount:</td>
                  <td style="padding: 8px 0; color: #d32f2f; text-align: right; font-weight: 500; width: 120px;">-৳${discount.toFixed(2)}</td>
                </tr>
                ` : ''}
                <tr style="border-top: 2px solid #ddd;">
                  <td style="padding: 12px 0; color: #333; text-align: right; font-size: 16px; font-weight: 700;">TOTAL:</td>
                  <td style="padding: 12px 0; color: #667eea; text-align: right; font-weight: 700; font-size: 16px; width: 120px;">৳${total.toFixed(2)}</td>
                </tr>
              </table>
            </div>

            <!-- Feedback Section -->
            <div style="background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%); padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
              <h3 style="margin: 0 0 10px 0; color: #333; font-size: 14px;">Help Us Improve</h3>
              <p style="margin: 0 0 15px 0; color: #666; font-size: 13px;">Share your feedback about your purchase</p>
              <a href="${feedbackLink}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; border-radius: 4px; text-decoration: none; font-weight: 600; font-size: 14px;">Rate Your Experience</a>
            </div>
          </div>

          <!-- Footer -->
          <div style="background-color: #f9f9f9; padding: 20px; text-align: center; border-top: 1px solid #eee;">
            <p style="margin: 0 0 10px 0; color: #666; font-size: 12px;">
              Thank you for shopping with us!
            </p>
            <p style="margin: 0; color: #999; font-size: 11px;">
              ${process.env.SHOP_NAME || 'ZENO'}<br/>
              Email: ${process.env.SHOP_EMAIL || 'shop@example.com'}
            </p>
          </div>
        </div>
      </body>
      </html>
    `

    // Send email with PDF attachment
    await mailer.sendMail({
      from: process.env.GMAIL_USER,
      to: sale.customerId.email,
      subject: `Your Receipt - ${sale.memoId}`,
      html: htmlContent,
      attachments: [
        {
          filename: `${sale.memoId}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    })

    console.log(`[Email] Sent memo email to ${sale.customerId.email} for sale ${sale.memoId}`)
    return true
  } catch (error) {
    console.error(`[Email] Failed to send memo email for sale ${sale.memoId}:`, error.message)
    return false
  }
}

export const sendInvitationEmail = async (invitation, shopId) => {
  try {
    const mailer = getTransporter()
    if (!mailer) {
      console.log(`[Email] Skipping invitation email - Gmail credentials not configured`)
      return false
    }

    const shop = await Shop.findById(shopId)

    if (!shop) {
      console.log(`[Email] Shop not found for invitation ${invitation.id}`)
      return false
    }

    const inviteLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/accept-invite/${invitation.token}`

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #0066cc; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
            .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; }
            .button { display: inline-block; padding: 12px 24px; background: #0066cc; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>You've been invited to join ZENO</h1>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p>You've been invited to join <strong>${shop.name}</strong> on ZENO Shop Management System as a seller.</p>
              <p>Click the button below to accept this invitation and set up your account:</p>
              <a href="${inviteLink}" class="button">Accept Invitation</a>
              <p>Or copy this link: <a href="${inviteLink}">${inviteLink}</a></p>
              <p>This invitation will expire in 7 days.</p>
              <p>If you didn't expect this invitation, you can safely ignore this email.</p>
              <hr>
              <p style="color: #666; font-size: 12px;">ZENO Shop Management System</p>
            </div>
          </div>
        </body>
      </html>
    `

    await mailer.sendMail({
      from: process.env.GMAIL_USER,
      to: invitation.email,
      subject: `Invitation to join ${shop.name} on ZENO`,
      html: htmlContent,
    })

    console.log(`[Email] Sent invitation email to ${invitation.email} for shop ${shop.name}`)
    return true
  } catch (error) {
    console.error(`[Email] Failed to send invitation email:`, error.message)
    return false
  }
}
