import axios from 'axios'

const api = axios.create({
  baseURL: `${import.meta.env.PUBLIC_API_URL}/api/v1`,
  withCredentials: true, // send httpOnly auth_token cookie on every request
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && window.location.pathname !== '/login') {
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
