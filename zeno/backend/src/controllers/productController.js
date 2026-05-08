import Product from '../models/Product.js'

const createProduct = async (req, res, next) => {
  try {
    if (!req.user) return next({ status: 401, message: 'Not authenticated' })
    if (req.user.role === 'shopkeeper' && !req.user.shopId) return next({ status: 403, message: 'SHOP_REQUIRED' })

    const product = await Product.create({
      ...req.body,
      shopId: req.user.shopId || req.body.shopId,
    })
    res.status(201).json({ success: true, data: product })
  } catch (err) {
    next(err)
  }
}

const getProducts = async (req, res, next) => {
  try {
    if (!req.user) return next({ status: 401, message: 'Not authenticated' })

    const { search, category, lowStockOnly } = req.query
    const query = { shopId: req.user.shopId }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
      ]
    }

    if (category) query.category = category
    if (lowStockOnly === 'true') query.$expr = { $lte: ['$stockQty', '$minStock'] }

    const products = await Product.find(query).sort({ createdAt: -1 })
    res.status(200).json({ success: true, data: products })
  } catch (err) {
    next(err)
  }
}

const getProductById = async (req, res, next) => {
  try {
    if (!req.user) return next({ status: 401, message: 'Not authenticated' })

    const product = await Product.findById(req.params.id)
    if (!product) return next({ status: 404, message: 'Product not found' })

    if (req.user.role !== 'admin' && product.shopId.toString() !== req.user.shopId) {
      return next({ status: 403, message: 'Access denied' })
    }

    res.status(200).json({ success: true, data: product })
  } catch (err) {
    next(err)
  }
}

const updateProduct = async (req, res, next) => {
  try {
    if (!req.user) return next({ status: 401, message: 'Not authenticated' })

    const product = await Product.findById(req.params.id)
    if (!product) return next({ status: 404, message: 'Product not found' })

    if (req.user.role !== 'admin' && product.shopId.toString() !== req.user.shopId) {
      return next({ status: 403, message: 'Access denied' })
    }

    const updated = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    res.status(200).json({ success: true, data: updated })
  } catch (err) {
    next(err)
  }
}

const deleteProduct = async (req, res, next) => {
  try {
    if (!req.user) return next({ status: 401, message: 'Not authenticated' })
    if (req.user.role === 'seller') return next({ status: 403, message: 'Sellers cannot delete products' })

    const product = await Product.findById(req.params.id)
    if (!product) return next({ status: 404, message: 'Product not found' })

    if (product.shopId.toString() !== req.user.shopId) {
      return next({ status: 403, message: 'Access denied' })
    }

    await Product.findByIdAndDelete(req.params.id)
    res.status(200).json({ success: true, message: 'Product deleted' })
  } catch (err) {
    next(err)
  }
}

const getLowStockProducts = async (req, res, next) => {
  try {
    if (!req.user) return next({ status: 401, message: 'Not authenticated' })

    const products = await Product.find({
      shopId: req.user.shopId,
      $expr: { $lte: ['$stockQty', '$minStock'] },
    }).sort({ stockQty: 1 })

    res.status(200).json({ success: true, data: products })
  } catch (err) {
    next(err)
  }
}

const getCategories = async (req, res, next) => {
  try {
    if (!req.user) return next({ status: 401, message: 'Not authenticated' })

    const categories = await Product.distinct('category', { shopId: req.user.shopId })
    res.status(200).json({ success: true, data: categories.filter(Boolean).sort() })
  } catch (err) {
    next(err)
  }
}

export { createProduct, getProducts, getProductById, updateProduct, deleteProduct, getLowStockProducts, getCategories }
