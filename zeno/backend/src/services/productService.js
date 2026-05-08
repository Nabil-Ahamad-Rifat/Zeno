import Product from '../models/Product.js'

export const createProduct = async (shopId, data) => {
  const { name, category, unit, price, costPrice, stockQty, minStock, expiryDate } = data
  return Product.create({
    shopId,
    name,
    category,
    unit,
    price: parseFloat(price),
    costPrice: parseFloat(costPrice),
    stockQty: parseInt(stockQty, 10),
    minStock: parseInt(minStock, 10),
    expiryDate: expiryDate ? new Date(expiryDate) : null,
  })
}

export const getProducts = async (shopId, filters = {}) => {
  const { search, category, lowStockOnly } = filters
  const query = { shopId }

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { category: { $regex: search, $options: 'i' } },
    ]
  }

  if (category) query.category = category

  if (lowStockOnly) query.$expr = { $lte: ['$stockQty', '$minStock'] }

  return Product.find(query).sort({ createdAt: -1 })
}

export const getProductById = (shopId, productId) =>
  Product.findOne({ _id: productId, shopId })

export const updateProduct = async (shopId, productId, data) => {
  const product = await Product.findOne({ _id: productId, shopId })
  if (!product) throw new Error('PRODUCT_NOT_FOUND')

  const { name, category, unit, price, costPrice, stockQty, minStock, expiryDate } = data

  Object.assign(product, {
    name: name ?? product.name,
    category: category ?? product.category,
    unit: unit ?? product.unit,
    price: price !== undefined ? parseFloat(price) : product.price,
    costPrice: costPrice !== undefined ? parseFloat(costPrice) : product.costPrice,
    stockQty: stockQty !== undefined ? parseInt(stockQty, 10) : product.stockQty,
    minStock: minStock !== undefined ? parseInt(minStock, 10) : product.minStock,
    expiryDate: expiryDate !== undefined ? (expiryDate ? new Date(expiryDate) : null) : product.expiryDate,
  })

  return product.save()
}

export const deleteProduct = async (shopId, productId) => {
  const product = await Product.findOneAndDelete({ _id: productId, shopId })
  if (!product) throw new Error('PRODUCT_NOT_FOUND')
  return product
}

export const getLowStockProducts = (shopId) =>
  Product.find({ shopId, $expr: { $lte: ['$stockQty', '$minStock'] } })
    .select('_id name category unit stockQty minStock')
    .sort({ stockQty: 1 })

export const getCategories = async (shopId) => {
  const categories = await Product.distinct('category', { shopId })
  return categories.filter(Boolean)
}
