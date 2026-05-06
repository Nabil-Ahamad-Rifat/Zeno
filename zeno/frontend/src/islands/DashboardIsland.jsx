import { useState, useEffect } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Line, Bar } from 'react-chartjs-2'
import * as dashboardService from '../services/dashboard.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
)

const DashboardIsland = () => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchDashboard = async () => {
    try {
      setLoading(true)
      const result = await dashboardService.getDashboardSummary()
      setData(result)
      setError('')
    } catch (err) {
      setError('Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboard()
    const interval = setInterval(fetchDashboard, 60000)
    return () => clearInterval(interval)
  }, [])

  if (loading && !data) {
    return <div className="text-center py-8">Loading dashboard...</div>
  }

  if (error && !data) {
    return <div className="p-3 bg-red-100 text-red-700 rounded">{error}</div>
  }

  if (!data) return null

  const hasAlerts =
    data.alerts.lowStock.length > 0 || data.alerts.lowRatings.length > 0

  // Prepare chart data
  const lineChartData = {
    labels: data.salesLast30Days.map((d) => d.date),
    datasets: [
      {
        label: 'Sales Revenue',
        data: data.salesLast30Days.map((d) => d.total),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        tension: 0.4,
      },
    ],
  }

  const barChartData = {
    labels: data.topProducts.map((p) => p.name),
    datasets: [
      {
        label: 'Quantity Sold',
        data: data.topProducts.map((p) => p.qty_sold),
        backgroundColor: '#10b981',
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        display: true,
        position: 'top',
      },
    },
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <button
          onClick={fetchDashboard}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
        >
          Refresh
        </button>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm">Total Customers</p>
          <p className="text-3xl font-bold text-gray-900">
            {data.totalCustomers}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm">Total Sales</p>
          <p className="text-3xl font-bold text-gray-900">{data.totalSales}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm">Avg Rating</p>
          <p className="text-3xl font-bold text-yellow-500">
            {data.avgRating.toFixed(1)} ⭐
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm">Today's Revenue</p>
          <p className="text-3xl font-bold text-green-600">
            ৳{data.todayRevenue.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Sales Last 30 Days</h2>
          <Line data={lineChartData} options={chartOptions} />
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Top 5 Products</h2>
          <Bar data={barChartData} options={chartOptions} />
        </div>
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sales */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">Recent Sales</h2>
          </div>
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold">
                  Memo
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold">
                  Customer
                </th>
                <th className="px-6 py-3 text-center text-sm font-semibold">
                  Items
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {data.recentSales.map((sale) => (
                <tr key={sale.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-3 text-sm font-mono text-blue-600">
                    {sale.memoId}
                  </td>
                  <td className="px-6 py-3 text-sm">{sale.customer}</td>
                  <td className="px-6 py-3 text-sm text-center">{sale.items}</td>
                  <td className="px-6 py-3 text-sm text-right font-semibold">
                    ৳{sale.total.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Recent Feedback */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">Recent Feedback</h2>
          </div>
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold">
                  Customer
                </th>
                <th className="px-6 py-3 text-center text-sm font-semibold">
                  Rating
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold">
                  Comment
                </th>
              </tr>
            </thead>
            <tbody>
              {data.recentFeedback.map((fb) => (
                <tr key={fb.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-3 text-sm">{fb.customer}</td>
                  <td className="px-6 py-3 text-sm text-center">
                    {Array(fb.rating)
                      .fill('⭐')
                      .join('')}
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-600 truncate">
                    {fb.comment}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Alerts */}
      {hasAlerts && (
        <div className="bg-red-50 rounded-lg border border-red-200 overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-red-900 mb-4">
              ⚠️ Alerts
            </h2>

            {data.alerts.lowStock.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-red-800 mb-3">
                  Low Stock Products ({data.alerts.lowStock.length})
                </h3>
                <div className="space-y-2">
                  {data.alerts.lowStock.map((product) => (
                    <div
                      key={product.id}
                      className="flex justify-between items-center bg-white p-3 rounded border border-red-200"
                    >
                      <span className="font-medium">{product.name}</span>
                      <span className="text-red-600">
                        {product.stockQty} / {product.minStock}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {data.alerts.lowRatings.length > 0 && (
              <div>
                <h3 className="font-semibold text-red-800 mb-3">
                  Low Ratings - Last 7 Days ({data.alerts.lowRatings.length})
                </h3>
                <div className="space-y-2">
                  {data.alerts.lowRatings.map((fb) => (
                    <div
                      key={fb.id}
                      className="flex justify-between items-center bg-white p-3 rounded border border-red-200"
                    >
                      <div>
                        <p className="font-medium text-sm">{fb.customer}</p>
                        <p className="text-xs text-gray-600">{fb.comment}</p>
                      </div>
                      <span className="text-red-600">
                        {Array(fb.rating)
                          .fill('⭐')
                          .join('')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="text-center text-sm text-gray-500">
        Auto-refreshes every 60 seconds
      </div>
    </div>
  )
}

export default DashboardIsland
