import { useState } from 'react'
import { setUser } from '../stores/auth.js'
import api from '../services/api.js'

const openOAuthPopup = (provider, onSuccess, onError) => {
  const apiUrl = import.meta.env.PUBLIC_API_URL || 'http://localhost:4000'
  const popup = window.open(
    `${apiUrl}/api/v1/oauth/${provider}`,
    `${provider}-oauth`,
    'width=500,height=600,left=400,top=100,scrollbars=yes,resizable=yes'
  )
  const handler = (event) => {
    if (event.origin !== window.location.origin) return
    if (event.data?.type === 'oauth-success') { cleanup(); onSuccess(event.data) }
    else if (event.data?.type === 'oauth-error') { cleanup(); onError(event.data.message) }
  }
  const closedCheck = setInterval(() => { if (popup?.closed) cleanup() }, 500)
  const cleanup = () => { clearInterval(closedCheck); window.removeEventListener('message', handler) }
  window.addEventListener('message', handler)
}

const RegisterIsland = ({ initialError }) => {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', role: 'customer' })
  const [error, setError] = useState(initialError || '')
  const [loading, setLoading] = useState(false)

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    try {
      const res = await api.post('/auth/register', {
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
      })
      window.location.href = '/login?registered=1'
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleOAuth = (provider) => {
    openOAuthPopup(
      provider,
      (data) => { setUser(data.user); window.location.href = data.redirect || '/dashboard' },
      (msg) => setError(msg || `${provider} sign-in failed.`)
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold mb-2 text-center text-blue-600">ZENO</h1>
        <p className="text-gray-500 text-center mb-8">Create your account</p>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
            {error}
          </div>
        )}

        <div className="space-y-3 mb-6">
          {/* Google */}
          <button
            onClick={() => handleOAuth('google')}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 text-sm font-medium text-gray-700"
          >
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            Continue with Google
          </button>

          {/* LinkedIn */}
          <button
            onClick={() => handleOAuth('linkedin')}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 text-sm font-medium text-gray-700"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#0A66C2">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
            Continue with LinkedIn
          </button>
        </div>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-xs text-gray-400">
            <span className="bg-white px-3">or sign up with email</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              value={form.name}
              onChange={set('name')}
              placeholder="John Doe"
              className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={set('email')}
              placeholder="you@example.com"
              className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={form.password}
              onChange={set('password')}
              placeholder="Min. 6 characters"
              className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
            <input
              type="password"
              value={form.confirmPassword}
              onChange={set('confirmPassword')}
              className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Account Type</label>
            <select
              value={form.role}
              onChange={set('role')}
              className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              disabled={loading}
            >
              <option value="customer">Customer</option>
              <option value="shopkeeper">Shopkeeper (manage a shop)</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 font-medium"
          >
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p className="text-sm text-center text-gray-500 mt-6">
          Already have an account?{' '}
          <a href="/login" className="text-blue-600 hover:underline font-medium">Sign in</a>
        </p>

        <p className="text-xs text-center text-gray-400 mt-4">
          By creating an account you agree to our{' '}
          <a href="/terms" className="hover:underline">Terms of Service</a>
          {' '}&middot;{' '}
          <a href="/privacy" className="hover:underline">Privacy Policy</a>
        </p>
      </div>
    </div>
  )
}

export default RegisterIsland
