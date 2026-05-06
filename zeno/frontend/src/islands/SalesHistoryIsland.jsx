import { useState, useEffect } from 'react'
import Modal from '../components/Modal.jsx'
import * as saleService from '../services/sales.js'
import * as customerService from '../services/customers.js'

const SalesHistoryIsland = () => {
  const [sales, setSales] = useState([])
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filterDate, setFilterDate] = useState('')
  const [filterCustomerId, setFilterCustomerId] = useState('')
  const [selectedSale, setSelectedSale] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState('')
  const [resendLoading, setResendLoading] = useState(false)

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true)
        const [salesData, customersData] = await Promise.all([
          saleService.getSales({}),
          customerService.getCustomers(),
        ])
        setSales(salesData)
        setCustomers(customersData)
        setError('')
      } catch (err) {
        setError('Failed to load sales history')
      } finally {
        setLoading(false)
      }
    }
    fetchInitialData()
  }, [])

  useEffect(() => {
    const fetchFilteredSales = async () => {
      try {
        setLoading(true)
        const params = {}
        if (filterDate) params.date = filterDate
        if (filterCustomerId) params.customerId = filterCustomerId
        const salesData = await saleService.getSales(params)
        setSales(salesData)
        setError('')
      } catch (err) {
        setError('Failed to load sales history')
      } finally {
        setLoading(false)
      }
    }
    if (filterDate || filterCustomerId) {
      fetchFilteredSales()
    }
  }, [filterDate, filterCustomerId])

  const handleViewSale = async (saleId) => {
    try {
      setDetailLoading(true)
      const sale = await saleService.getSaleById(saleId)
      setSelectedSale(sale)
      setShowDetailModal(true)
    } catch (err) {
      setError('Failed to load sale details')
    } finally {
      setDetailLoading(false)
    }
  }

  const handleClearFilters = () => {
    setFilterDate('')
    setFilterCustomerId('')
  }

  const handleDownloadPDF = async () => {
    try {
      setDetailError('')
      const pdfBlob = await saleService.downloadMemoPDF(selectedSale.id)
      const url = window.URL.createObjectURL(pdfBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${selectedSale.memoId}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      setDetailError('Failed to download PDF')
    }
  }

  const handleResendMemo = async () => {
    try {
      setResendLoading(true)
      setDetailError('')
      const result = await saleService.resendMemoEmail(selectedSale.id)
      alert(result.message)
      setResendLoading(false)
    } catch (err) {
      setDetailError(err.response?.data?.message || 'Failed to resend memo')
      setResendLoading(false)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-6">
      <h1 className="text-3xl font-bold mb-6">Sales History</h1>

      {/* Filter Bar */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Date</label>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Customer</label>
            <select
              value={filterCustomerId}
              onChange={(e) => setFilterCustomerId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Customers</option>
              {customers.map((cust) => (
                <option key={cust.id} value={cust.id}>
                  {cust.name}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleClearFilters}
            className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-100 text-red-700 text-sm rounded mb-4">
          {error}
        </div>
      )}

      {/* Sales Table */}
      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : sales.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-6 text-center text-gray-500">
          No sales found
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold">Memo ID</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Customer</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Items</th>
                <th className="px-6 py-3 text-right text-sm font-semibold">Discount</th>
                <th className="px-6 py-3 text-right text-sm font-semibold">Total</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Date</th>
                <th className="px-6 py-3 text-center text-sm font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((sale) => (
                <tr key={sale.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-mono font-semibold">
                    {sale.memoId}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {sale.customer ? sale.customer.name : 'Walk-in'}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {sale._count?.items || 0}
                  </td>
                  <td className="px-6 py-4 text-sm text-right">
                    {Number(sale.discount) > 0 ? (
                      <span className="text-red-600">
                        −৳{Number(sale.discount).toFixed(2)}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-right font-semibold">
                    ৳{Number(sale.totalAmount).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {formatDate(sale.createdAt)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleViewSale(sale.id)}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title={selectedSale?.memoId}
      >
        {detailLoading ? (
          <div className="text-center py-8">Loading...</div>
        ) : selectedSale ? (
          <div className="space-y-4 py-4">
            {/* Header Info */}
            <div className="pb-4 border-b space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Customer:</span>
                <span className="font-semibold">
                  {selectedSale.customer ? selectedSale.customer.name : 'Walk-in'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Date:</span>
                <span className="font-semibold">
                  {formatDate(selectedSale.createdAt)}
                </span>
              </div>
            </div>

            {/* Items Table */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Items</h3>
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-3 py-2 text-left">Product</th>
                    <th className="px-3 py-2 text-center">Unit</th>
                    <th className="px-3 py-2 text-center">Qty</th>
                    <th className="px-3 py-2 text-right">Unit Price</th>
                    <th className="px-3 py-2 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedSale.items.map((item) => (
                    <tr key={item.id} className="border-b">
                      <td className="px-3 py-2">{item.product.name}</td>
                      <td className="px-3 py-2 text-center">{item.product.unit}</td>
                      <td className="px-3 py-2 text-center">{item.quantity}</td>
                      <td className="px-3 py-2 text-right">
                        ৳{Number(item.unitPrice).toFixed(2)}
                      </td>
                      <td className="px-3 py-2 text-right">
                        ৳{Number(item.subtotal).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals Footer */}
            <div className="border-t pt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>
                  ৳
                  {selectedSale.items
                    .reduce((sum, item) => sum + Number(item.subtotal), 0)
                    .toFixed(2)}
                </span>
              </div>
              {Number(selectedSale.discount) > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Discount:</span>
                  <span>−৳{Number(selectedSale.discount).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base border-t pt-2">
                <span>Total:</span>
                <span>৳{Number(selectedSale.totalAmount).toFixed(2)}</span>
              </div>
            </div>

            {/* Error message */}
            {detailError && (
              <div className="p-3 bg-red-100 text-red-700 text-sm rounded mt-4">
                {detailError}
              </div>
            )}

            {/* Action Buttons */}
            <div className="border-t pt-4 flex gap-3">
              <button
                onClick={handleDownloadPDF}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
              >
                📥 Download PDF
              </button>
              {selectedSale.customer && selectedSale.customer.email && (
                <button
                  onClick={handleResendMemo}
                  disabled={resendLoading}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 text-sm font-medium"
                >
                  {resendLoading ? 'Sending...' : '📧 Resend Memo'}
                </button>
              )}
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  )
}

export default SalesHistoryIsland
