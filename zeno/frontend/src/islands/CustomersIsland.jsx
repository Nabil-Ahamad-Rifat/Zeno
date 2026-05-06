import { useState, useEffect } from 'react'
import Modal from '../components/Modal.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import { customerSchema } from '../utils/validators.js'
import * as customerService from '../services/customers.js'

const CustomersIsland = () => {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [formErrors, setFormErrors] = useState({})

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    tag: 'new',
  })

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    try {
      setLoading(true)
      const data = await customerService.getCustomers()
      setCustomers(data)
      setError('')
    } catch (err) {
      setError('Failed to load customers')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenAddModal = () => {
    setFormData({ name: '', phone: '', email: '', address: '', tag: 'new' })
    setFormErrors({})
    setShowAddModal(true)
  }

  const handleOpenEditModal = (customer) => {
    setEditingCustomer(customer)
    setFormData(customer)
    setFormErrors({})
    setShowEditModal(true)
  }

  const handleOpenDeleteConfirm = (id) => {
    setDeletingId(id)
    setShowDeleteConfirm(true)
  }

  const handleSubmitForm = async (isEdit) => {
    try {
      const result = customerSchema.safeParse(formData)

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

      if (isEdit) {
        await customerService.updateCustomer(editingCustomer.id, result.data)
        setShowEditModal(false)
      } else {
        await customerService.createCustomer(result.data)
        setShowAddModal(false)
      }

      await fetchCustomers()
      setFormData({ name: '', phone: '', email: '', address: '', tag: 'new' })
    } catch (err) {
      setError('Failed to save customer')
    }
  }

  const handleDeleteCustomer = async () => {
    try {
      await customerService.deleteCustomer(deletingId)
      await fetchCustomers()
      setShowDeleteConfirm(false)
    } catch (err) {
      setError('Failed to delete customer')
    }
  }

  const getTagColor = (tag) => {
    switch (tag) {
      case 'vip':
        return 'bg-yellow-100 text-yellow-800'
      case 'regular':
        return 'bg-gray-100 text-gray-800'
      case 'new':
      default:
        return 'bg-blue-100 text-blue-800'
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Customers</h1>
        <button
          onClick={handleOpenAddModal}
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          + Add Customer
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
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold">
                  Tag
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold">
                  Address
                </th>
                <th className="px-6 py-3 text-center text-sm font-semibold">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {customers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    No customers yet
                  </td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <tr key={customer.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4">{customer.name}</td>
                    <td className="px-6 py-4">{customer.phone}</td>
                    <td className="px-6 py-4">{customer.email || '-'}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${getTagColor(
                          customer.tag
                        )}`}
                      >
                        {customer.tag}
                      </span>
                    </td>
                    <td className="px-6 py-4">{customer.address || '-'}</td>
                    <td className="px-6 py-4 text-center space-x-2">
                      <button
                        onClick={() => handleOpenEditModal(customer)}
                        className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleOpenDeleteConfirm(customer.id)}
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
        title="Add Customer"
      >
        <CustomerForm
          formData={formData}
          setFormData={setFormData}
          formErrors={formErrors}
          onSubmit={() => handleSubmitForm(false)}
        />
      </Modal>

      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Customer"
      >
        <CustomerForm
          formData={formData}
          setFormData={setFormData}
          formErrors={formErrors}
          onSubmit={() => handleSubmitForm(true)}
        />
      </Modal>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteCustomer}
        message="Are you sure you want to delete this customer?"
      />
    </div>
  )
}

const CustomerForm = ({ formData, setFormData, formErrors, onSubmit }) => {
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
        <label className="block text-sm font-medium mb-1">Phone</label>
        <input
          type="text"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          className={`w-full px-3 py-2 border rounded ${
            formErrors.phone ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {formErrors.phone && (
          <p className="text-red-500 text-sm mt-1">{formErrors.phone}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Email</label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className={`w-full px-3 py-2 border rounded ${
            formErrors.email ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {formErrors.email && (
          <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Address</label>
        <input
          type="text"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Tag</label>
        <select
          value={formData.tag}
          onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded"
        >
          <option value="new">New</option>
          <option value="regular">Regular</option>
          <option value="vip">VIP</option>
        </select>
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

export default CustomersIsland
