import axios from 'axios'
import { getKioskToken, KIOSK_IDENTITY_ERRORS } from './kiosk'

const baseURL = import.meta.env.VITE_API_URL

if (!baseURL) {
  throw new Error('VITE_API_URL belum diatur di file .env frontend')
}

console.log('API BASE URL:', baseURL)

export const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    const kioskToken = getKioskToken()
    if (kioskToken && !config.headers['x-kiosk-token']) {
      config.headers['x-kiosk-token'] = kioskToken
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API ERROR:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url,
      baseURL: error.config?.baseURL,
    })

    // Unregistered, revoked or disabled kiosk: send staff to setup instead of failing mid-session.
    const code = error.response?.data?.code
    if (KIOSK_IDENTITY_ERRORS.includes(code) && window.location.pathname !== '/setup') {
      window.location.assign(`/setup?reason=${encodeURIComponent(code)}`)
    }

    return Promise.reject(error)
  }
)

export default api