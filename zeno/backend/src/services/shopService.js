import User from '../models/User.js'
import Shop from '../models/Shop.js'

export const createShop = async (userId, data) => {
  const { name, address, phone, logoUrl } = data

  const user = await User.findById(userId)
  if (!user) throw new Error('USER_NOT_FOUND')
  if (user.role !== 'shopkeeper') throw new Error('ONLY_SHOPKEEPER_CAN_CREATE_SHOP')
  if (user.shopId) throw new Error('USER_ALREADY_HAS_SHOP')

  const shop = await Shop.create({ name, address, phone, logoUrl, ownerId: userId })

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { shopId: shop._id },
    { new: true }
  ).select('-passwordHash -socialAccounts -__v')

  return { shop, user: updatedUser }
}

export const getShopById = (shopId) =>
  Shop.findById(shopId).populate('ownerId', 'id name email')

export const getUserShop = async (userId) => {
  const user = await User.findById(userId).select('shopId')
  if (!user || !user.shopId) return null
  return getShopById(user.shopId)
}
