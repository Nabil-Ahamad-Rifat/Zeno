import Sale from '../models/Sale.js'

const createFeedback = async (req, res, next) => {
  try {
    const { feedbackToken } = req.params
    const { rating, comment } = req.body

    const sale = await Sale.findOne({ feedbackToken })
    if (!sale) return next({ status: 404, message: 'Sale not found' })

    if (sale.feedback) return next({ status: 400, message: 'Feedback already submitted for this sale' })

    sale.feedback = { rating, comment: comment || null, createdAt: new Date() }
    await sale.save()

    res.status(201).json({ success: true, message: 'Thank you for your feedback!', data: sale.feedback })
  } catch (err) {
    next(err)
  }
}

const getFeedback = async (req, res, next) => {
  try {
    const { feedbackToken } = req.params

    const sale = await Sale.findOne({ feedbackToken }).select('memoId totalAmount feedback')
    if (!sale) return next({ status: 404, message: 'Sale not found' })

    res.status(200).json({
      success: true,
      data: { memoId: sale.memoId, totalAmount: sale.totalAmount, feedback: sale.feedback },
    })
  } catch (err) {
    next(err)
  }
}

const getSaleStats = async (req, res, next) => {
  try {
    if (!req.user) return next({ status: 401, message: 'Not authenticated' })

    const matchStage = req.user.role === 'admin'
      ? { feedback: { $exists: true, $ne: null } }
      : { shopId: req.user.shopId, feedback: { $exists: true, $ne: null } }

    const [stats, ratingGroups] = await Promise.all([
      Sale.aggregate([
        { $match: matchStage },
        { $group: { _id: null, avgRating: { $avg: '$feedback.rating' }, count: { $sum: 1 } } },
      ]),
      Sale.aggregate([
        { $match: matchStage },
        { $group: { _id: '$feedback.rating', count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
    ])

    res.status(200).json({
      success: true,
      data: {
        totalFeedback: stats[0]?.count || 0,
        averageRating: stats[0]?.avgRating ? parseFloat(stats[0].avgRating.toFixed(2)) : 0,
        ratingBreakdown: ratingGroups.map((r) => ({ rating: r._id, count: r.count })),
      },
    })
  } catch (err) {
    next(err)
  }
}

export { createFeedback, getFeedback, getSaleStats }
