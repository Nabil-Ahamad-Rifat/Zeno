import { atom } from 'nanostores'
import api from '../services/api.js'

const stored = typeof window !== 'undefined' ? localStorage.getItem('user') : null

export const currentUser = atom(stored ? JSON.parse(stored) : null)

export const setUser = (user) => {
  localStorage.setItem('user', JSON.stringify(user))
  currentUser.set(user)
}

export const logout = async () => {
  try {
    await api.post('/auth/logout')
  } catch {
    // ignore — clear client state regardless
  }
  localStorage.removeItem('user')
  currentUser.set(null)
  window.location.href = '/login'
}
