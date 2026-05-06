import { useState, useEffect } from 'react'
import Modal from '../components/Modal.jsx'
import * as productService from '../services/products.js'
import * as customerService from '../services/customers.js'
import * as saleService from '../services/sales.js'

const NewSaleIsland = () => {
  const [products, setProducts] = useState([])
  const [customers, setCustomers] = useState([])
  const [cart, setCart] = useState([])
  const [selectedCustomerId, setSelectedCustomerId] = useState('')
  const [discount, setDiscount] = useState(0)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [successSale, setSuccessSale] = useState(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [prods, custs] = await Promise.all([
        productService.getProducts(),
        customerService.getCustomers(),
      ])
      setProducts(prods)
      setCustomers(custs)
      setError('')
    } catch (err) {
      setError('Failed to load products or customers')
    } finally {
      setLoading(false)
    }
  }

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  const cartSubtotal = cart.reduce(
    (sum, item) => sum + parseFloat(item.product.price) * item.quantity,
    0
  )
  const grandTotal = Math.max(0, cartSubtotal - Number(discount))

  const addToCart = (product) => {
    if (product.stockQty === 0) return
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id)
      if (existing) {
        const newQty = Math.min(existing.quantity + 1, product.stockQty)
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: newQty } : i
        )
      }
      return [...prev, { product, quantity: 1 }]
    })
  }

  const updateQty = (productId, delta) => {
    setCart((prev) =>
      prev
        .map((i) => {
          if (i.product.id !== productId) return i
          const product = products.find((p) => p.id === productId)
          const newQty = Math.min(
            Math.max(1, i.quantity + delta),
            product.stockQty
          )
          return { ...i, quantity: newQty }
        })
        .filter((i) => i.quantity > 0)
    )
  }

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((i) => i.product.id !== productId))
  }

  const handleCompleteSale = async () => {
    if (cart.length === 0) return
    setSubmitting(true)
    setError('')
    try {
      const payload = {
        items: cart.map((i) => ({
          productId: i.product.id,
          quantity: i.quantity,
        })),
        customerId: selectedCustomerId ? Number(selectedCustomerId) : undefined,
        discount: Number(discount) || 0,
      }
      const sale = await saleService.createSale(payload)
      setSuccessSale(sale)
      setShowSuccessModal(true)
    } catch (err) {
      setError(
        err.response?.data?.message || 'Failed to complete sale'
      )
    } finally {
      setSubmitting(false)
    }
  }

  const handleStartNewSale = () => {
    setShowSuccessModal(false)
    setSuccessSale(null)
    setCart([])
    setSelectedCustomerId('')
    setDiscount(0)
    setSearch('')
    fetchData()
  }

  const isLowStock = (stockQty, minStock) => stockQty <= minStock

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 flex gap-6">
      {/* Products Panel */}
      <div className="flex-[3]">
        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : (
          <>
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    product.stockQty === 0
                      ? 'opacity-50 cursor-not-allowed bg-gray-100'
                      : 'bg-white hover:shadow-md'
                  }`}
                  onClick={() => addToCart(product)}
                >
                  <h3 className="font-semibold text-sm">{product.name}</h3>
                  <p className="text-xs text-gray-600 mt-1">{product.category}</p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="font-bold text-blue-600">
                      ৳{parseFloat(product.price).toFixed(2)}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-semibold ${
                        product.stockQty === 0
                          ? 'bg-gray-200 text-gray-600'
                          : isLowStock(product.stockQty, product.minStock)
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {product.stockQty} {product.unit}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Cart Panel */}
      <div className="flex-[2] sticky top-20 h-fit">
        <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
          <h2 className="text-xl font-bold">Order Summary</h2>

          {error && (
            <div className="p-3 bg-red-100 text-red-700 text-sm rounded">
              {error}
            </div>
          )}

          {/* Customer Selection */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Customer (Optional)
            </label>
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Walk-in Customer</option>
              {customers.map((cust) => (
                <option key={cust.id} value={cust.id}>
                  {cust.name}
                </option>
              ))}
            </select>
          </div>

          {/* Cart Items */}
          <div className="border rounded-lg p-4 max-h-60 overflow-y-auto">
            {cart.length === 0 ? (
              <p className="text-gray-500 text-center text-sm py-4">
                Cart is empty
              </p>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex items-center justify-between border-b pb-2"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-semibold">{item.product.name}</p>
                      <p className="text-xs text-gray-600">
                        ৳{parseFloat(item.product.price).toFixed(2)} × {item.quantity}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQty(item.product.id, -1)}
                        className="px-2 py-1 bg-gray-200 rounded text-xs hover:bg-gray-300"
                      >
                        −
                      </button>
                      <span className="px-2 text-sm">{item.quantity}</span>
                      <button
                        onClick={() => updateQty(item.product.id, 1)}
                        disabled={item.quantity >= item.product.stockQty}
                        className="px-2 py-1 bg-gray-200 rounded text-xs hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        +
                      </button>
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="px-2 py-1 bg-red-200 text-red-700 rounded text-xs hover:bg-red-300"
                      >
                        ×
                      </button>
                    </div>
                    <div className="text-right ml-2">
                      <p className="text-sm font-semibold">
                        ৳{(parseFloat(item.product.price) * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Discount */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Discount (৳)
            </label>
            <input
              type="number"
              min="0"
              step="1"
              value={discount}
              onChange={(e) => setDiscount(Number(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Totals */}
          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span>৳{cartSubtotal.toFixed(2)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-sm text-red-600">
                <span>Discount:</span>
                <span>−৳{Number(discount).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg border-t pt-2">
              <span>Total:</span>
              <span>৳{grandTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Complete Sale Button */}
          <button
            onClick={handleCompleteSale}
            disabled={cart.length === 0 || submitting}
            className="w-full px-4 py-3 bg-green-600 text-white rounded font-semibold hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? 'Processing...' : 'Complete Sale'}
          </button>
        </div>
      </div>

      {/* Success Modal */}
      <Modal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Sale Completed"
      >
        <div className="space-y-4 text-center py-4">
          <p className="text-green-600 text-5xl">✓</p>
          <p className="text-sm text-gray-500">Memo ID</p>
          <p className="text-3xl font-bold font-mono tracking-wider">
            {successSale?.memoId}
          </p>
          <p className="text-lg text-gray-700">
            Total: <strong>৳{successSale && parseFloat(successSale.totalAmount).toFixed(2)}</strong>
          </p>
          <div className="flex gap-3 justify-center pt-4">
            <button
              onClick={handleStartNewSale}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Start New Sale
            </button>
            <button
              onClick={() => window.location.href = '/sales'}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              View History
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default NewSaleIsland
