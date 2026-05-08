import { useState } from 'react'
import { setUser } from '../stores/auth.js'
import api from '../services/api.js'

const OnboardingIsland = () => {
  const [form, setForm] = useState({ name: '', address: '', phone: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.post('/shops/create', form)
      setUser(res.data.user)
      window.location.href = '/dashboard'
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create shop. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold mb-2 text-center text-blue-600">ZENO</h1>
        <p className="text-gray-500 text-center mb-2">Welcome! Set up your shop to get started.</p>
        <p className="text-xs text-center text-gray-400 mb-8">You can update these details later from settings.</p>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Shop Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={set('name')}
              placeholder="My Awesome Shop"
              className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <input
              type="text"
              value={form.address}
              onChange={set('address')}
              placeholder="Dhaka, Bangladesh"
              className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="text"
              value={form.phone}
              onChange={set('phone')}
              placeholder="01700000000"
              className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 font-medium mt-2"
          >
            {loading ? 'Creating shop…' : 'Create Shop & Continue'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default OnboardingIsland
