import axios from 'axios'

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to attach bearer token
api.interceptors.request.use(
  (config) => {
    try {
      const authStorage = localStorage.getItem('auth-storage')
      if (authStorage) {
        const parsed = JSON.parse(authStorage)
        const token = parsed?.state?.token
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
      }
    } catch (e) {
      console.error('Error reading auth token from storage:', e)
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle session expiration (401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear auth-storage and redirect to login
      localStorage.removeItem('auth-storage')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)
export default api
