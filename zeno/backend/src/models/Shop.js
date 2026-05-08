import mongoose from 'mongoose'

const shopSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    address: String,
    phone: String,
    logoUrl: String,
    status: { type: String, enum: ['active', 'suspended'], default: 'active' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

shopSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString()
    delete ret._id
    delete ret.__v
    return ret
  },
})

export default mongoose.model('Shop', shopSchema)
