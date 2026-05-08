import mongoose from 'mongoose'

const productSchema = new mongoose.Schema(
  {
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
    name: { type: String, required: true },
    category: String,
    unit: String,
    price: { type: Number, required: true },
    costPrice: { type: Number, required: true },
    stockQty: { type: Number, default: 0 },
    minStock: { type: Number, default: 0 },
    expiryDate: Date,
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

productSchema.index({ shopId: 1 })
productSchema.index({ shopId: 1, category: 1 })

productSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString()
    delete ret._id
    delete ret.__v
    return ret
  },
})

export default mongoose.model('Product', productSchema)
