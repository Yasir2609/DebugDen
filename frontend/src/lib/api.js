import axios from 'axios'

/**
 * Axios client pre-configured for the DebugDen API.
 * - Base URL: {VITE_API_URL}/api/v1 (VITE_API_URL points to Render backend in production,
 *   falls back to relative '/api/v1' locally so Vite's dev proxy still works)
 * - withCredentials for cookie-based refresh tokens
 * - Request interceptor attaches Bearer token from localStorage
 * - Response interceptor handles 401 with silent refresh attempt
 */
const BASE_URL = `${import.meta.env.VITE_API_URL || ''}/api/v1`

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor — attach access token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

// Response interceptor — silent token refresh on 401
let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // If 401 and not already retrying, attempt silent refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Skip refresh for auth endpoints (login, register, refresh itself)
      if (originalRequest.url?.startsWith('/auth/')) {
        localStorage.removeItem('accessToken')
        return Promise.reject(error)
      }

      if (isRefreshing) {
        // Queue this request until refresh completes
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return api(originalRequest)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        // Call refresh endpoint — sends refresh token via httpOnly cookie
        const res = await axios.post(`${BASE_URL}/auth/refresh`, {}, { withCredentials: true })
        const newToken = res.data.accessToken
        localStorage.setItem('accessToken', newToken)
        processQueue(null, newToken)

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return api(originalRequest)
      } catch (refreshError) {
        // Refresh failed — clear token and redirect to login
        processQueue(refreshError, null)
        localStorage.removeItem('accessToken')
        window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  },
)

export default api