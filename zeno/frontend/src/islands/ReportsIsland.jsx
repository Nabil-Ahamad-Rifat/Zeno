import { useState, useEffect } from 'react'
import * as reportService from '../services/reports.js'

const ReportsIsland = () => {
  const [activeTab, setActiveTab] = useState('sales')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [groupBy, setGroupBy] = useState('day')
  const [exporting, setExporting] = useState(false)

  const fetchReport = async () => {
    try {
      setLoading(true)
      setError('')
      const params = {}

      if (fromDate) params.from = fromDate
      if (toDate) params.to = toDate
      if (activeTab === 'sales') params.groupBy = groupBy

      let result
      if (activeTab === 'sales') {
        result = await reportService.getSalesReport(params)
      } else if (activeTab === 'stock') {
        result = await reportService.getStockReport(params)
      } else if (activeTab === 'customers') {
        result = await reportService.getCustomersReport(params)
      } else if (activeTab === 'profit') {
        result = await reportService.getProfitReport(params)
      }

      setData(result.data)
    } catch (err) {
      setError('Failed to load report')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReport()
  }, [activeTab])

  const handleExport = async (format) => {
    try {
      setExporting(true)
      const params = {}
      if (fromDate) params.from = fromDate
      if (toDate) params.to = toDate
      if (activeTab === 'sales') params.groupBy = groupBy

      const blob = await reportService.downloadReport(activeTab, params, format)
      const filename = `${activeTab}-report.${format === 'pdf' ? 'pdf' : 'xlsx'}`

      if (format === 'pdf') {
        reportService.exportToPDF(blob, filename)
      } else {
        reportService.exportToExcel(blob, filename)
      }
    } catch (err) {
      setError('Failed to export report')
      console.error(err)
    } finally {
      setExporting(false)
    }
  }

  const tabs = [
    { id: 'sales', label: 'Sales' },
    { id: 'stock', label: 'Stock' },
    { id: 'customers', label: 'Customers' },
    { id: 'profit', label: 'Profit' },
  ]

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Reports</h1>

      {/* Tabs */}
      <div className="flex border-b mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 font-semibold transition-colors ${
              activeTab === tab.id
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              From Date
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              To Date
            </label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {activeTab === 'sales' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Group By
              </label>
              <select
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="day">Day</option>
                <option value="week">Week</option>
                <option value="month">Month</option>
              </select>
            </div>
          )}

          <div className="flex items-end">
            <button
              onClick={fetchReport}
              disabled={loading}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
            >
              {loading ? 'Loading...' : 'Apply Filters'}
            </button>
          </div>
        </div>
      </div>

      {/* Export Buttons */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => handleExport('pdf')}
          disabled={!data || exporting}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition-colors flex items-center gap-2"
        >
          📄 Export PDF
        </button>
        <button
          onClick={() => handleExport('xlsx')}
          disabled={!data || exporting}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors flex items-center gap-2"
        >
          📊 Export Excel
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-100 text-red-700 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Data Table */}
      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading report...</div>
      ) : data && data.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b">
                {Object.keys(data[0]).map((key) => (
                  <th
                    key={key}
                    className="px-4 py-2 text-left text-sm font-semibold text-gray-700"
                  >
                    {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, idx) => (
                <tr key={idx} className="border-b hover:bg-gray-50">
                  {Object.values(row).map((val, colIdx) => (
                    <td key={colIdx} className="px-4 py-2 text-sm text-gray-700">
                      {typeof val === 'number' && val % 1 !== 0
                        ? val.toFixed(2)
                        : val}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          {data ? 'No data available' : 'Select filters and click "Apply Filters"'}
        </div>
      )}
    </div>
  )
}

export default ReportsIsland
