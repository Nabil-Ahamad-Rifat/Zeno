import mongoose from 'mongoose'

// Embedded sub-document — product snapshot captured at time of sale
const saleItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    productName: String,
    productCategory: String,
    productUnit: String,
    costPrice: Number,   // snapshot for profit calculation
    quantity: { type: Number, required: true },
    unitPrice: { type: Number, required: true },
    subtotal: { type: Number, required: true },
  },
  { _id: false }
)

// Embedded — one feedback per sale
const feedbackSchema = new mongoose.Schema(
  {
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: String,
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
)

const saleSchema = new mongoose.Schema(
  {
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', default: null },
    customerUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    totalAmount: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    memoId: { type: String, unique: true },
    feedbackToken: { type: String, unique: true },
    emailSent: { type: Boolean, default: false },
    items: [saleItemSchema],
    feedback: feedbackSchema,
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

saleSchema.index({ shopId: 1, createdAt: -1 })

saleSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString()
    delete ret._id
    delete ret.__v
    return ret
  },
})

export default mongoose.model('Sale', saleSchema)
