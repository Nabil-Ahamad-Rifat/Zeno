import crypto from 'crypto'
import User from '../models/User.js'
import Invitation from '../models/Invitation.js'
import { createUser } from './authService.js'

export const generateInviteToken = () => crypto.randomBytes(16).toString('hex')

export const createInvitation = (shopId, email) => {
  const token = generateInviteToken()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  return Invitation.create({ shopId, email, token, expiresAt })
}

export const getInvitation = async (token) => {
  const invitation = await Invitation.findOne({ token }).populate('shopId')
  if (!invitation) throw new Error('INVITATION_NOT_FOUND')
  if (invitation.usedAt) throw new Error('INVITATION_ALREADY_USED')
  if (new Date() > invitation.expiresAt) throw new Error('INVITATION_EXPIRED')
  return invitation
}

export const acceptInvitation = async (token, name, password) => {
  const invitation = await getInvitation(token)

  const existing = await User.findOne({ email: invitation.email })
  if (existing) throw new Error('USER_ALREADY_EXISTS')

  const user = await createUser({ name, email: invitation.email, password, role: 'seller' })

  const updatedUser = await User.findByIdAndUpdate(
    user._id || user.id,
    { shopId: invitation.shopId._id || invitation.shopId },
    { new: true }
  ).select('-passwordHash -socialAccounts -__v')

  await Invitation.findByIdAndUpdate(invitation._id, { usedAt: new Date() })

  return updatedUser
}

export const getShopStaff = (shopId) =>
  User.find({ shopId, role: 'seller' })
    .select('id name email status createdAt')
    .sort({ createdAt: 1 })

export const removeSeller = async (shopId, sellerId) => {
  const user = await User.findById(sellerId)
  if (!user) throw new Error('USER_NOT_FOUND')
  if (!user.shopId || user.shopId.toString() !== shopId.toString()) {
    throw new Error('USER_NOT_IN_SHOP')
  }
  return User.findByIdAndUpdate(sellerId, { status: 'banned' }, { new: true })
}
