import mongoose from 'mongoose'

const stockMovementSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop' },
    changeQty: { type: Number, required: true },
    reason: String,
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

stockMovementSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString()
    delete ret._id
    delete ret.__v
    return ret
  },
})

export default mongoose.model('StockMovement', stockMovementSchema)
