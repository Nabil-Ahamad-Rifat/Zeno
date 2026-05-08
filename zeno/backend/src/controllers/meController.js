import {
  getCustomerPurchases,
  getSaleForCustomer,
  updateCustomerProfile,
  getUserSocialAccounts,
  disconnectSocialAccount,
} from '../services/customerService.js'
import { generateMemoPDF } from '../services/memoService.js'

export const getPurchases = async (req, res, next) => {
  try {
    if (!req.user) {
      return next({
        status: 401,
        message: 'Not authenticated',
      })
    }

    const purchases = await getCustomerPurchases(req.user.userId)

    res.status(200).json({
      success: true,
      data: purchases,
    })
  } catch (err) {
    next(err)
  }
}

export const getMemo = async (req, res, next) => {
  try {
    if (!req.user) {
      return next({
        status: 401,
        message: 'Not authenticated',
      })
    }

    const { saleId } = req.params

    const sale = await getSaleForCustomer(req.user.userId, saleId)

    const pdfBuffer = await generateMemoPDF(sale, sale.shopId?.name || process.env.SHOP_NAME || 'ZENO')

    res.contentType('application/pdf')
    res.setHeader('Content-Disposition', `inline; filename="${sale.memoId}.pdf"`)
    res.send(pdfBuffer)
  } catch (err) {
    if (err.message === 'SALE_NOT_FOUND') {
      return next({
        status: 404,
        message: 'Sale not found',
      })
    }
    if (err.message === 'ACCESS_DENIED') {
      return next({
        status: 403,
        message: 'Access denied',
      })
    }
    next(err)
  }
}

export const updateProfile = async (req, res, next) => {
  try {
    if (!req.user) {
      return next({
        status: 401,
        message: 'Not authenticated',
      })
    }

    const { name, phone, avatarUrl } = req.body

    const user = await updateCustomerProfile(req.user.userId, {
      name,
      phone,
      avatarUrl,
    })

    res.status(200).json({
      success: true,
      user,
    })
  } catch (err) {
    next(err)
  }
}

export const getSocialAccounts = async (req, res, next) => {
  try {
    if (!req.user) {
      return next({
        status: 401,
        message: 'Not authenticated',
      })
    }

    const accounts = await getUserSocialAccounts(req.user.userId)

    res.status(200).json({
      success: true,
      data: accounts,
    })
  } catch (err) {
    next(err)
  }
}

export const disconnectAccount = async (req, res, next) => {
  try {
    if (!req.user) {
      return next({
        status: 401,
        message: 'Not authenticated',
      })
    }

    const { accountId } = req.params

    await disconnectSocialAccount(req.user.userId, accountId)

    res.status(200).json({
      success: true,
      message: 'Account disconnected',
    })
  } catch (err) {
    if (err.message === 'ACCOUNT_NOT_FOUND') {
      return next({
        status: 404,
        message: 'Account not found',
      })
    }
    if (err.message === 'ACCESS_DENIED') {
      return next({
        status: 403,
        message: 'Access denied',
      })
    }
    if (err.message === 'CANNOT_DISCONNECT_ONLY_LOGIN') {
      return next({
        status: 400,
        message: 'Cannot disconnect your only login method. Set a password first.',
      })
    }
    next(err)
  }
}
