import User from '../models/User.js'
import Shop from '../models/Shop.js'
import Sale from '../models/Sale.js'

export const getAdminStats = async () => {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const [totalUsers, totalShops, totalSales, revenueResult, newUsersLast7Days, newShopsLast30Days] =
    await Promise.all([
      User.countDocuments(),
      Shop.countDocuments(),
      Sale.countDocuments(),
      Sale.aggregate([{ $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
      User.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      Shop.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
    ])

  return {
    totalUsers,
    totalShops,
    totalSales,
    totalRevenue: revenueResult[0]?.total || 0,
    newUsersLast7Days,
    newShopsLast30Days,
  }
}

export const getUsers = async (filters = {}, page = 1, limit = 20) => {
  const { role, status, search } = filters
  const query = {}

  if (role) query.role = role
  if (status) query.status = status
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ]
  }

  const skip = (page - 1) * limit

  const [users, total] = await Promise.all([
    User.find(query)
      .select('-passwordHash -socialAccounts -__v')
      .populate('shopId', 'id name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    User.countDocuments(query),
  ])

  return { users, total, pages: Math.ceil(total / limit), currentPage: page }
}

export const banUser = async (userId) => {
  const user = await User.findByIdAndUpdate(userId, { status: 'banned' }, { new: true })
    .select('id name email status')
  if (!user) throw new Error('USER_NOT_FOUND')
  return user
}

export const unbanUser = async (userId) => {
  const user = await User.findByIdAndUpdate(userId, { status: 'active' }, { new: true })
    .select('id name email status')
  if (!user) throw new Error('USER_NOT_FOUND')
  return user
}

export const updateUserRole = async (userId, newRole) => {
  const validRoles = ['admin', 'shopkeeper', 'seller', 'customer']
  if (!validRoles.includes(newRole)) throw new Error('INVALID_ROLE')

  const user = await User.findByIdAndUpdate(userId, { role: newRole }, { new: true })
    .select('id name email role status')
  if (!user) throw new Error('USER_NOT_FOUND')
  return user
}

export const getShops = async (page = 1, limit = 20) => {
  const skip = (page - 1) * limit

  const [shops, total] = await Promise.all([
    Shop.find()
      .populate('ownerId', 'id name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Shop.countDocuments(),
  ])

  // Enrich with counts
  const enriched = await Promise.all(
    shops.map(async (shop) => {
      const [productCount, salesCount, staffCount] = await Promise.all([
        (await import('../models/Product.js')).default.countDocuments({ shopId: shop._id }),
        Sale.countDocuments({ shopId: shop._id }),
        User.countDocuments({ shopId: shop._id, role: 'seller' }),
      ])
      return { ...shop.toJSON(), _count: { products: productCount, sales: salesCount, users: staffCount } }
    })
  )

  return { shops: enriched, total, pages: Math.ceil(total / limit), currentPage: page }
}

export const suspendShop = async (shopId) => {
  const shop = await Shop.findById(shopId)
  if (!shop) throw new Error('SHOP_NOT_FOUND')

  await Shop.findByIdAndUpdate(shopId, { status: 'suspended' })
  await User.updateMany(
    { shopId, role: { $in: ['shopkeeper', 'seller'] } },
    { status: 'banned' }
  )

  return shop
}
