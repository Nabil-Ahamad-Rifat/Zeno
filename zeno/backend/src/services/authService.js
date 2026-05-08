import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import CryptoJS from 'crypto-js'
import User from '../models/User.js'

const encryptToken = (token) =>
  CryptoJS.AES.encrypt(token, process.env.OAUTH_TOKEN_ENCRYPTION_KEY).toString()

export const hashPassword = (password) => bcrypt.hash(password, 12)

export const verifyPassword = (password, hash) => bcrypt.compare(password, hash)

export const issueJWT = (user) => {
  const payload = {
    userId: user._id ? user._id.toString() : user.id.toString(),
    email: user.email,
    name: user.name,
    role: user.role,
    shopId: user.shopId ? user.shopId.toString() : null,
  }
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '24h',
  })
}

export const verifyJWT = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET)
  } catch {
    throw new Error('Invalid or expired token')
  }
}

export const getUserById = (userId) =>
  User.findById(userId).select('-passwordHash -socialAccounts -__v')

export const getUserByEmail = (email) => User.findOne({ email })

export const createUser = async ({ name, email, password, role }) => {
  const passwordHash = await hashPassword(password)
  const user = await User.create({ name, email, passwordHash, role, status: 'active', emailVerified: false })
  return User.findById(user._id).select('-passwordHash -socialAccounts -__v')
}

export const findOrCreateSocialUser = async (provider, profile) => {
  const providerId = profile.id
  const email = profile.emails?.[0]?.value
  const name = profile.displayName ||
    (profile.name ? `${profile.name.givenName ?? ''} ${profile.name.familyName ?? ''}`.trim() : 'User')
  const picture = profile.photos?.[0]?.value
  const accessToken = profile.accessToken
  const refreshToken = profile.refreshToken

  if (!email) throw new Error('EMAIL_REQUIRED')

  // Check if social account already linked to any user
  let user = await User.findOne({
    'socialAccounts.provider': provider,
    'socialAccounts.providerUserId': providerId,
  })

  if (user) {
    await User.updateOne(
      { _id: user._id, 'socialAccounts.provider': provider },
      {
        $set: {
          'socialAccounts.$.accessToken': encryptToken(accessToken),
          'socialAccounts.$.refreshToken': refreshToken ? encryptToken(refreshToken) : null,
        },
      }
    )
    return user
  }

  // Check existing user by email
  user = await User.findOne({ email })

  if (user) {
    await User.updateOne(
      { _id: user._id },
      {
        $push: {
          socialAccounts: {
            provider,
            providerUserId: providerId,
            accessToken: encryptToken(accessToken),
            refreshToken: refreshToken ? encryptToken(refreshToken) : null,
          },
        },
      }
    )
    return user
  }

  // Create new user
  user = await User.create({
    name,
    email,
    role: 'customer',
    status: 'active',
    emailVerified: true,
    avatarUrl: picture,
    socialAccounts: [
      {
        provider,
        providerUserId: providerId,
        accessToken: encryptToken(accessToken),
        refreshToken: refreshToken ? encryptToken(refreshToken) : null,
      },
    ],
  })

  return user
}
