import { createShop, getShopById, getUserShop } from '../services/shopService.js'
import { issueJWT } from '../services/authService.js'

export const createShopHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      return next({
        status: 401,
        message: 'Not authenticated',
      })
    }

    const { name, address, phone, logoUrl } = req.body

    const { shop, user } = await createShop(req.user.userId, {
      name,
      address,
      phone,
      logoUrl,
    })

    // Re-issue JWT with new shopId
    const token = issueJWT(user)

    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000,
    })

    res.status(201).json({
      success: true,
      shop,
      user,
    })
  } catch (err) {
    if (err.message === 'USER_NOT_FOUND') {
      return next({
        status: 404,
        message: 'User not found',
      })
    }
    if (err.message === 'ONLY_SHOPKEEPER_CAN_CREATE_SHOP') {
      return next({
        status: 403,
        message: 'Only shopkeepers can create shops',
      })
    }
    if (err.message === 'USER_ALREADY_HAS_SHOP') {
      return next({
        status: 409,
        message: 'User already has a shop',
      })
    }
    next(err)
  }
}

export const getShop = async (req, res, next) => {
  try {
    if (!req.user) {
      return next({
        status: 401,
        message: 'Not authenticated',
      })
    }

    const shop = await getUserShop(req.user.userId)

    if (!shop) {
      return next({
        status: 404,
        message: 'Shop not found',
      })
    }

    res.status(200).json({
      success: true,
      shop,
    })
  } catch (err) {
    next(err)
  }
}
