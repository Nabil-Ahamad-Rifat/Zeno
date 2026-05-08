import { signInWithPopup, signOut as firebaseSignOut } from 'firebase/auth'
import { auth, googleProvider } from '../config/firebase.js'
import api from './api.js'
import { setUser } from '../stores/auth.js'

export const signInWithGoogle = async () => {
  const result = await signInWithPopup(auth, googleProvider)
  const idToken = await result.user.getIdToken()

  const res = await api.post('/auth/firebase', { idToken })
  setUser(res.data.user)

  return res.data.user
}

export const firebaseSignOutOnly = () => firebaseSignOut(auth)
