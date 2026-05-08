import Shop from '../models/Shop.js'

const requireActiveShop = async (req, res, next) => {
  if (!req.user) return next({ status: 401, message: 'Not authenticated' })

  if (!['shopkeeper', 'seller'].includes(req.user.role)) return next()

  if (!req.user.shopId) return next({ status: 403, message: 'SHOP_REQUIRED' })

  try {
    const shop = await Shop.findById(req.user.shopId).select('_id name status')
    if (!shop) return next({ status: 403, message: 'Shop not found' })
    if (shop.status !== 'active') return next({ status: 403, message: 'Shop is suspended' })

    req.shop = shop
    next()
  } catch (err) {
    next(err)
  }
}

export default requireActiveShop
