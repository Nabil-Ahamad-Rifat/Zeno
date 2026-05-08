const requireShop = (req, res, next) => {
  if (!req.user) {
    return next({
      status: 401,
      message: 'Not authenticated',
    })
  }

  if (req.user.role === 'shopkeeper' && !req.user.shopId) {
    return next({
      status: 403,
      message: 'SHOP_REQUIRED',
    })
  }

  next()
}

export default requireShop
