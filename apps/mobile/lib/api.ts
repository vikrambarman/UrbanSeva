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

export const healthApi = {
  check: () => api.get('/health'),
}

export const categoriesApi = {
  getAll: () => api.get('/categories'),
  getBySlug: (slug: string) => api.get(`/categories/${slug}`),
}

export const servicesApi = {
  getTrending: (limit = 8) =>
    api.get(`/services?trending=true&limit=${limit}`),
  getFeatured: (limit = 6) =>
    api.get(`/services?featured=true&limit=${limit}`),
  getByCategory: (catSlug: string, limit = 10) =>
    api.get(`/services?category=${catSlug}&limit=${limit}`),
  getBySubCategory: (catSlug: string, subSlug: string) =>
    api.get(`/services?category=${catSlug}&subcategory=${subSlug}`),
  getBySlug: (slug: string) =>
    api.get(`/services/${slug}`),
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