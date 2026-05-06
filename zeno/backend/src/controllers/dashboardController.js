import prisma from '../utils/prisma.js'

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
      prisma.customer.count(),

      prisma.sale.count(),

      prisma.feedback.aggregate({
        _avg: { rating: true },
        _count: true,
      }),

      prisma.sale.aggregate({
        _sum: { totalAmount: true },
        where: { createdAt: { gte: today } },
      }),

      prisma.sale.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        select: { createdAt: true, totalAmount: true },
        orderBy: { createdAt: 'asc' },
      }),

      prisma.saleItem.groupBy({
        by: ['productId'],
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5,
      }),

      prisma.sale.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { id: true, name: true } },
          _count: { select: { items: true } },
        },
      }),

      prisma.feedback.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          sale: {
            select: {
              id: true,
              memoId: true,
              customer: { select: { name: true } },
            },
          },
        },
      }),

      prisma.$queryRaw`
        SELECT id, name, stockQty, minStock
        FROM products
        WHERE stockQty <= minStock
      `,

      prisma.feedback.findMany({
        where: { createdAt: { gte: sevenDaysAgo }, rating: { lte: 2 } },
        include: {
          sale: {
            select: {
              memoId: true,
              customer: { select: { name: true } },
            },
          },
        },
      }),
    ])

    // Group sales by date for trend
    const salesByDate = {}
    salesLast30Days.forEach((sale) => {
      const dateKey = sale.createdAt.toISOString().split('T')[0]
      if (!salesByDate[dateKey]) {
        salesByDate[dateKey] = 0
      }
      salesByDate[dateKey] += Number(sale.totalAmount)
    })

    const trend = Object.entries(salesByDate).map(([date, total]) => ({
      date,
      total: Math.round(total * 100) / 100,
    }))

    // Get product names for top products
    const topProductIds = topProducts.map((p) => p.productId)
    const topProductDetails = await prisma.product.findMany({
      where: { id: { in: topProductIds } },
      select: { id: true, name: true },
    })

    const topProductMap = Object.fromEntries(
      topProductDetails.map((p) => [p.id, p.name])
    )

    const topProductsFormatted = topProducts.map((p) => ({
      name: topProductMap[p.productId],
      qty_sold: p._sum.quantity,
    }))

    const avgRating = feedbackData._avg.rating || 0

    const todayRevenue = Math.round(
      (Number(todaySalesData._sum?.totalAmount || 0) * 100) / 100 * 100
    ) / 100

    const recentSalesFormatted = recentSales.map((sale) => ({
      id: sale.id,
      memoId: sale.memoId,
      customer: sale.customer?.name || 'Walk-in',
      items: sale._count.items,
      total: Math.round(Number(sale.totalAmount) * 100) / 100,
      date: sale.createdAt,
    }))

    const recentFeedbackFormatted = recentFeedback.map((fb) => ({
      id: fb.id,
      customer: fb.sale.customer?.name || 'Walk-in',
      rating: fb.rating,
      comment: fb.comment || 'No comment',
      date: fb.createdAt,
    }))

    res.json({
      totalCustomers,
      totalSales,
      avgRating: Math.round(avgRating * 100) / 100,
      todayRevenue,
      salesLast30Days: trend,
      topProducts: topProductsFormatted,
      recentSales: recentSalesFormatted,
      recentFeedback: recentFeedbackFormatted,
      alerts: {
        lowStock: lowStockProducts,
        lowRatings: lowRatingFeedback.map((fb) => ({
          id: fb.id,
          customer: fb.sale.customer?.name || 'Walk-in',
          memoId: fb.sale.memoId,
          rating: fb.rating,
          comment: fb.comment,
          date: fb.createdAt,
        })),
      },
    })
  } catch (error) {
    next(error)
  }
}
