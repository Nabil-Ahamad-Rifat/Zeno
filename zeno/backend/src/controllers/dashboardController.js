import Sale from '../models/Sale.js'
import Customer from '../models/Customer.js'
import Product from '../models/Product.js'

export const getDashboardSummary = async (req, res, next) => {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const thirtyDaysAgo = new Date(today)
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const sevenDaysAgo = new Date(today)
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const [
      totalCustomers,
      totalSales,
      feedbackData,
      todaySalesData,
      salesLast30Days,
      topProducts,
      recentSales,
      recentFeedback,
      lowStockProducts,
      lowRatingFeedback,
    ] = await Promise.all([
      Customer.countDocuments(),

      Sale.countDocuments(),

      Sale.aggregate([
        { $match: { feedback: { $exists: true, $ne: null } } },
        { $group: { _id: null, avgRating: { $avg: '$feedback.rating' }, count: { $sum: 1 } } },
      ]),

      Sale.aggregate([
        { $match: { createdAt: { $gte: today } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),

      Sale.find({ createdAt: { $gte: thirtyDaysAgo } })
        .select('createdAt totalAmount')
        .sort({ createdAt: 1 }),

      Sale.aggregate([
        { $unwind: '$items' },
        { $group: { _id: '$items.productId', totalQty: { $sum: '$items.quantity' }, name: { $first: '$items.productName' } } },
        { $sort: { totalQty: -1 } },
        { $limit: 5 },
        { $project: { _id: 0, name: 1, qty_sold: '$totalQty' } },
      ]),

      Sale.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('customerId', 'name')
        .select('memoId totalAmount customerId items createdAt'),

      Sale.find({ feedback: { $exists: true, $ne: null } })
        .sort({ 'feedback.createdAt': -1 })
        .limit(5)
        .populate('customerId', 'name')
        .select('memoId feedback customerId'),

      Product.find({ $expr: { $lte: ['$stockQty', '$minStock'] } })
        .select('_id name stockQty minStock'),

      Sale.find({
        'feedback.createdAt': { $gte: sevenDaysAgo },
        'feedback.rating': { $lte: 2 },
      })
        .populate('customerId', 'name')
        .select('memoId feedback customerId'),
    ])

    // Group sales by date for trend
    const salesByDate = {}
    salesLast30Days.forEach((sale) => {
      const dateKey = sale.createdAt.toISOString().split('T')[0]
      salesByDate[dateKey] = (salesByDate[dateKey] || 0) + Number(sale.totalAmount)
    })
    const trend = Object.entries(salesByDate).map(([date, total]) => ({
      date,
      total: Math.round(total * 100) / 100,
    }))

    const avgRating = feedbackData[0]?.avgRating || 0
    const todayRevenue = Math.round((todaySalesData[0]?.total || 0) * 100) / 100

    const recentSalesFormatted = recentSales.map((sale) => ({
      id: sale._id.toString(),
      memoId: sale.memoId,
      customer: sale.customerId?.name || 'Walk-in',
      items: sale.items.length,
      total: Math.round(Number(sale.totalAmount) * 100) / 100,
      date: sale.createdAt,
    }))

    const recentFeedbackFormatted = recentFeedback.map((fb) => ({
      id: fb._id.toString(),
      customer: fb.customerId?.name || 'Walk-in',
      rating: fb.feedback.rating,
      comment: fb.feedback.comment || 'No comment',
      date: fb.feedback.createdAt,
    }))

    res.json({
      totalCustomers,
      totalSales,
      avgRating: Math.round(avgRating * 100) / 100,
      todayRevenue,
      salesLast30Days: trend,
      topProducts,
      recentSales: recentSalesFormatted,
      recentFeedback: recentFeedbackFormatted,
      alerts: {
        lowStock: lowStockProducts,
        lowRatings: lowRatingFeedback.map((fb) => ({
          id: fb._id.toString(),
          customer: fb.customerId?.name || 'Walk-in',
          memoId: fb.memoId,
          rating: fb.feedback.rating,
          comment: fb.feedback.comment,
          date: fb.feedback.createdAt,
        })),
      },
    })
  } catch (error) {
    next(error)
  }
}
