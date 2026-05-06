import { atom } from 'nanostores'

export const authToken = atom(
  typeof window !== 'undefined' ? localStorage.getItem('token') : null
)

export const login = (token) => {
  localStorage.setItem('token', token)
  authToken.set(token)
}

export const logout = () => {
  localStorage.removeItem('token')
  authToken.set(null)
  window.location.href = '/login'
}
