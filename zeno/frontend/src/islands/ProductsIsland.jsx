import { useState, useEffect } from 'react'
import Modal from '../components/Modal.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import { productSchema } from '../utils/validators.js'
import * as productService from '../services/products.js'

const ProductsIsland = () => {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [formErrors, setFormErrors] = useState({})

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    unit: '',
    price: '',
    costPrice: '',
    stockQty: 0,
    minStock: 0,
    expiryDate: '',
  })

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const data = await productService.getProducts()
      setProducts(data)
      setError('')
    } catch (err) {
      setError('Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenAddModal = () => {
    setFormData({
      name: '',
      category: '',
      unit: '',
      price: '',
      costPrice: '',
      stockQty: 0,
      minStock: 0,
      expiryDate: '',
    })
    setFormErrors({})
    setShowAddModal(true)
  }

  const handleOpenEditModal = (product) => {
    setEditingProduct(product)
    setFormData({
      ...product,
      expiryDate: product.expiryDate
        ? new Date(product.expiryDate).toISOString().split('T')[0]
        : '',
    })
    setFormErrors({})
    setShowEditModal(true)
  }

  const handleOpenDeleteConfirm = (id) => {
    setDeletingId(id)
    setShowDeleteConfirm(true)
  }

  const handleSubmitForm = async (isEdit) => {
    try {
      const result = productSchema.safeParse(formData)

      if (!result.success) {
        const errors = {}
        Object.entries(result.error.flatten().fieldErrors).forEach(
          ([key, messages]) => {
            errors[key] = messages[0]
          }
        )
        setFormErrors(errors)
        return
      }

      const payload = { ...result.data }
      if (!payload.expiryDate) delete payload.expiryDate

      if (isEdit) {
        await productService.updateProduct(editingProduct.id, payload)
        setShowEditModal(false)
      } else {
        await productService.createProduct(payload)
        setShowAddModal(false)
      }

      await fetchProducts()
      setFormData({
        name: '',
        category: '',
        unit: '',
        price: '',
        costPrice: '',
        stockQty: 0,
        minStock: 0,
        expiryDate: '',
      })
    } catch (err) {
      const msg = err.response?.data?.errors?.[0] || err.response?.data?.error || 'Failed to save product'
      setError(msg)
    }
  }

  const handleDeleteProduct = async () => {
    try {
      await productService.deleteProduct(deletingId)
      await fetchProducts()
      setShowDeleteConfirm(false)
    } catch (err) {
      setError('Failed to delete product')
    }
  }

  const isLowStock = (stockQty, minStock) => {
    return stockQty <= minStock
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Products</h1>
        <button
          onClick={handleOpenAddModal}
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          + Add Product
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold">
                  Unit
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold">
                  Price
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold">
                  Cost
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold">
                  Expiry
                </th>
                <th className="px-6 py-3 text-center text-sm font-semibold">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                    No products yet
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr
                    key={product.id}
                    className={`border-b hover:bg-gray-50 ${
                      isLowStock(product.stockQty, product.minStock)
                        ? 'bg-red-50'
                        : ''
                    }`}
                  >
                    <td className="px-6 py-4">{product.name}</td>
                    <td className="px-6 py-4">{product.category}</td>
                    <td className="px-6 py-4">{product.unit}</td>
                    <td className="px-6 py-4 text-right">
                      {parseFloat(product.price).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {parseFloat(product.costPrice).toFixed(2)}
                    </td>
                    <td
                      className={`px-6 py-4 text-right font-semibold ${
                        isLowStock(product.stockQty, product.minStock)
                          ? 'text-red-600'
                          : ''
                      }`}
                    >
                      {product.stockQty}
                      {isLowStock(product.stockQty, product.minStock) && (
                        <span className="text-red-600 text-xs ml-2">
                          (min: {product.minStock})
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {product.expiryDate
                        ? new Date(product.expiryDate).toLocaleDateString()
                        : '-'}
                    </td>
                    <td className="px-6 py-4 text-center space-x-2">
                      <button
                        onClick={() => handleOpenEditModal(product)}
                        className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleOpenDeleteConfirm(product.id)}
                        className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Product"
      >
        <ProductForm
          formData={formData}
          setFormData={setFormData}
          formErrors={formErrors}
          onSubmit={() => handleSubmitForm(false)}
        />
      </Modal>

      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Product"
      >
        <ProductForm
          formData={formData}
          setFormData={setFormData}
          formErrors={formErrors}
          onSubmit={() => handleSubmitForm(true)}
        />
      </Modal>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteProduct}
        message="Are you sure you want to delete this product?"
      />
    </div>
  )
}

const ProductForm = ({ formData, setFormData, formErrors, onSubmit }) => {
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Name</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className={`w-full px-3 py-2 border rounded ${
            formErrors.name ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {formErrors.name && (
          <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Category</label>
        <input
          type="text"
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          className={`w-full px-3 py-2 border rounded ${
            formErrors.category ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {formErrors.category && (
          <p className="text-red-500 text-sm mt-1">{formErrors.category}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Unit</label>
        <input
          type="text"
          value={formData.unit}
          onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
          className={`w-full px-3 py-2 border rounded ${
            formErrors.unit ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {formErrors.unit && (
          <p className="text-red-500 text-sm mt-1">{formErrors.unit}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Price</label>
          <input
            type="number"
            step="0.01"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            className={`w-full px-3 py-2 border rounded ${
              formErrors.price ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {formErrors.price && (
            <p className="text-red-500 text-sm mt-1">{formErrors.price}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Cost Price</label>
          <input
            type="number"
            step="0.01"
            value={formData.costPrice}
            onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
            className={`w-full px-3 py-2 border rounded ${
              formErrors.costPrice ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {formErrors.costPrice && (
            <p className="text-red-500 text-sm mt-1">{formErrors.costPrice}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Stock Qty</label>
          <input
            type="number"
            value={formData.stockQty}
            onChange={(e) => setFormData({ ...formData, stockQty: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Min Stock</label>
          <input
            type="number"
            value={formData.minStock}
            onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Expiry Date</label>
        <input
          type="date"
          value={formData.expiryDate}
          onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded"
        />
      </div>

      <div className="flex gap-3 justify-end mt-6">
        <button
          type="button"
          onClick={() => {}}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Save
        </button>
      </div>
    </form>
  )
}

export default ProductsIsland
