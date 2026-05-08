import mongoose from 'mongoose'

const socialAccountSchema = new mongoose.Schema(
  {
    provider: { type: String, enum: ['google', 'facebook', 'linkedin'], required: true },
    providerUserId: { type: String, required: true },
    accessToken: { type: String, required: true },
    refreshToken: String,
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: String,
    role: { type: String, enum: ['admin', 'shopkeeper', 'seller', 'customer'], default: 'customer' },
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', default: null },
    status: { type: String, enum: ['active', 'banned', 'pending'], default: 'active' },
    emailVerified: { type: Boolean, default: false },
    avatarUrl: String,
    phone: String,
    socialAccounts: [socialAccountSchema],
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

userSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString()
    delete ret._id
    delete ret.__v
    delete ret.passwordHash
    delete ret.socialAccounts
    return ret
  },
})

export default mongoose.model('User', userSchema)
