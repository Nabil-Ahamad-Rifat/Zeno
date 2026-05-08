import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import Shop from '../models/Shop.js'

export const requireAuth = async (req, res, next) => {
  const token = req.cookies?.auth_token

  if (!token) return next({ status: 401, message: 'No token provided' })

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    const user = await User.findById(decoded.userId).select('_id status role shopId')
    if (!user) {
      res.clearCookie('auth_token')
      return next({ status: 401, message: 'User not found' })
    }

    if (user.status !== 'active') {
      res.clearCookie('auth_token')
      return next({ status: 401, message: 'Account is no longer active' })
    }

    req.user = { ...decoded, shopId: user.shopId?.toString() ?? null }
    next()
  } catch (err) {
    next(err)
  }
}

export const requireRole = (...allowedRoles) => (req, res, next) => {
  if (!req.user) return next({ status: 401, message: 'Unauthorized' })
  if (!allowedRoles.includes(req.user.role)) return next({ status: 403, message: 'Access denied' })
  next()
}

export const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') return next({ status: 403, message: 'Admin access required' })
  next()
}

export const requireShopOwner = async (req, res, next) => {
  try {
    const { shopId } = req.params
    if (!shopId) return next({ status: 400, message: 'Shop ID required' })

    const shop = await Shop.findById(shopId)
    if (!shop) return next({ status: 404, message: 'Shop not found' })

    if (shop.ownerId.toString() !== req.user.userId && req.user.role !== 'admin') {
      return next({ status: 403, message: 'Access denied' })
    }

    req.shop = shop
    next()
  } catch (err) {
    next(err)
  }
}

export default requireAuth
