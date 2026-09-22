import axios from 'axios'
import * as SecureStore from 'expo-secure-store'
import Constants from 'expo-constants'

// ⚠️ IMPORTANT: localhost mobile pe kaam nahi karta
// Apna actual local IP use karo
const getApiUrl = () => {
  // EAS build environment variable
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL
  }

  // Expo config se
  const configUrl = Constants.expoConfig?.extra?.apiUrl
  if (configUrl) return configUrl

  // Development fallback — APNA IP YAHAN LIKHO
  return 'http://192.168.29.16:3000' 
}

const API_URL = getApiUrl()
console.log('🌐 API URL:', API_URL)

// Axios instance
export const api = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync('auth_token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    } catch (error) {
      console.error('Token read error:', error)
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync('auth_token')
      await SecureStore.deleteItemAsync('user_data')
    }
    return Promise.reject(error)
  }
)

// ═══════════════════════════════
// API HELPERS
// ═══════════════════════════════

// Health API
export const healthApi = {
  check: () => api.get('/health'),
}

// Categories API
export const categoriesApi = {
  getAll: () => api.get('/categories'),
  getBySlug: (slug: string) => api.get(`/categories/${slug}`),
}

// Services API
export const servicesApi = {
  getTrending: () => api.get('/services?trending=true&limit=8'),
  getByCategory: (categorySlug: string) =>
    api.get(`/services?category=${categorySlug}`),
  getFeatured: () => api.get('/services?featured=true&limit=6'),
  getBySlug: (slug: string) => api.get(`/services/${slug}`),
  search: (query: string, limit = 10) =>
    api.get(`/services/search?q=${encodeURIComponent(query)}&limit=${limit}`),
}

// Provider Services API
export const providerServicesApi = {
  getMyServices: (providerId: string) =>
    api.get(`/providers/my-services?providerId=${providerId}`),
}

export const authApi = {
  sendOtp: (phone: string) =>
    api.post('/auth/send-otp', { phone }),
  verifyOtp: (phone: string, otp: string) =>
    api.post('/auth/verify-otp', { phone, otp }),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data: Record<string, unknown>) =>
    api.put('/auth/profile', data),
}

export const bookingsApi = {
  getAll: (page = 1) => api.get(`/bookings?page=${page}`),
  getById: (id: string) => api.get(`/bookings/${id}`),
  create: (data: Record<string, unknown>) =>
    api.post('/bookings', data),
  cancel: (id: string, reason: string) =>
    api.patch(`/bookings/${id}/cancel`, { reason }),
}