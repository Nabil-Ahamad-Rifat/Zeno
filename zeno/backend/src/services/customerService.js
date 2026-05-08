import User from '../models/User.js'
import Sale from '../models/Sale.js'

export const getCustomerPurchases = (userId) =>
  Sale.find({ customerUserId: userId })
    .populate('shopId', 'id name')
    .populate('customerId', 'name')
    .select('-feedback -feedbackToken')
    .sort({ createdAt: -1 })

export const getSaleForCustomer = async (userId, saleId) => {
  const sale = await Sale.findById(saleId)
    .populate('customerId')
    .populate('shopId')

  if (!sale) throw new Error('SALE_NOT_FOUND')
  if (!sale.customerUserId || sale.customerUserId.toString() !== userId.toString()) {
    throw new Error('ACCESS_DENIED')
  }

  return sale
}

export const updateCustomerProfile = (userId, data) => {
  const { name, phone, avatarUrl } = data
  const update = {}
  if (name) update.name = name
  if (phone !== undefined) update.phone = phone || null
  if (avatarUrl !== undefined) update.avatarUrl = avatarUrl || null

  return User.findByIdAndUpdate(userId, update, { new: true })
    .select('-passwordHash -socialAccounts -__v')
}

export const getUserSocialAccounts = async (userId) => {
  const user = await User.findById(userId).select('socialAccounts')
  if (!user) return []
  return user.socialAccounts.map((sa) => ({
    id: sa._id.toString(),
    provider: sa.provider,
    providerUserId: sa.providerUserId,
    createdAt: sa.createdAt,
  }))
}

export const disconnectSocialAccount = async (userId, accountId) => {
  const user = await User.findById(userId).select('passwordHash socialAccounts')
  if (!user) throw new Error('USER_NOT_FOUND')

  const account = user.socialAccounts.id(accountId)
  if (!account) throw new Error('ACCOUNT_NOT_FOUND')

  if (!user.passwordHash && user.socialAccounts.length === 1) {
    throw new Error('CANNOT_DISCONNECT_ONLY_LOGIN')
  }

  user.socialAccounts.pull(accountId)
  await user.save()
}

export const linkSaleToCustomerUser = async (saleId, email) => {
  const user = await User.findOne({ email, role: 'customer' })
  if (!user) return null

  return Sale.findByIdAndUpdate(saleId, { customerUserId: user._id }, { new: true })
}
