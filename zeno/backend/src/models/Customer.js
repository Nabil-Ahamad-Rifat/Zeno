import mongoose from 'mongoose'

const customerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    email: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
    address: String,
    tag: { type: String, enum: ['new', 'regular', 'vip'], default: 'new' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

customerSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString()
    delete ret._id
    delete ret.__v
    return ret
  },
})

export default mongoose.model('Customer', customerSchema)
