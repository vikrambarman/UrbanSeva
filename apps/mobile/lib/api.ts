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


// ═══════════════════════════════════════════
// PROVIDER APIs (Phase 7)
// ═══════════════════════════════════════════

export const providerApi = {
  getProfile: () => api.get('/provider/profile'),
  updateProfile: (data: Record<string, unknown>) => api.put('/provider/profile', data),
  getDocuments: () => api.get('/provider/documents'),
  updateDocuments: (data: Record<string, unknown>) => api.put('/provider/documents', data),
  getBankDetails: () => api.get('/provider/bank-details'),
  updateBankDetails: (data: Record<string, unknown>) => api.put('/provider/bank-details', data),
  getJobs: (status = 'ALL') => api.get(`/provider/jobs?status=${status}`),
  getJobById: (id: string) => api.get(`/provider/jobs/${id}`),
  updateJobStatus: (id: string, action: string, extra?: Record<string, unknown>) =>
    api.post(`/provider/jobs/${id}/status`, { action, ...extra }),
  getEarnings: (period = 'all') => api.get(`/provider/earnings?period=${period}`),
  getPayouts: () => api.get('/provider/earnings/payouts'),
  requestPayout: () => api.post('/provider/earnings/payouts'),
  getReviews: () => api.get('/provider/reviews'),
  replyToReview: (id: string, reply: string) =>
    api.post(`/provider/reviews/${id}/reply`, { reply }),
}

// ═══════════════════════════════════════════
// ADMIN APIs (Phase 7)
// ═══════════════════════════════════════════

export const adminApi = {
  getDashboard: () => api.get('/admin/dashboard'),

  // Users
  getUsers: (params: Record<string, string> = {}) => {
    const query = new URLSearchParams(params).toString()
    return api.get(`/admin/users?${query}`)
  },
  getUserById: (id: string) => api.get(`/admin/users/${id}`),
  blockUser: (id: string) => api.post(`/admin/users/${id}/block`),
  unblockUser: (id: string) => api.post(`/admin/users/${id}/unblock`),

  // Providers
  getProviders: (params: Record<string, string> = {}) => {
    const query = new URLSearchParams(params).toString()
    return api.get(`/admin/providers?${query}`)
  },
  getProviderById: (id: string) => api.get(`/admin/providers/${id}`),
  getProviderApplications: () => api.get('/admin/providers/applications'),
  approveProvider: (id: string) => api.post(`/admin/providers/${id}/approve`),
  rejectProvider: (id: string) => api.post(`/admin/providers/${id}/reject`),

  // Services
  getServices: (params: Record<string, string> = {}) => {
    const query = new URLSearchParams(params).toString()
    return api.get(`/admin/services?${query}`)
  },

  // Bookings
  getBookings: (params: Record<string, string> = {}) => {
    const query = new URLSearchParams(params).toString()
    return api.get(`/admin/bookings?${query}`)
  },
  getBookingById: (id: string) => api.get(`/admin/bookings/${id}`),
  assignProvider: (bookingId: string, providerId: string) =>
    api.post(`/admin/bookings/${bookingId}/assign`, { providerId }),
  cancelBooking: (bookingId: string, reason: string) =>
    api.post(`/admin/bookings/${bookingId}/cancel`, { reason }),

  // Finance
  getFinanceStats: (period = 'all') => api.get(`/admin/finance/stats?period=${period}`),
  getPayouts: (status = 'ALL') => api.get(`/admin/finance/payouts?status=${status}`),
  processPayout: (payoutId: string) =>
    api.post('/admin/finance/payouts', { payoutId }),
  getRefunds: () => api.get('/admin/finance/refunds'),
  processRefund: (bookingId: string) =>
    api.post('/admin/finance/refunds', { bookingId }),

  // Analytics
  getSalesAnalytics: (period = '30') => api.get(`/admin/analytics/sales?period=${period}`),
  getServiceAnalytics: () => api.get('/admin/analytics/services'),
  getCustomerAnalytics: (period = '30') => api.get(`/admin/analytics/customers?period=${period}`),
}

// ═══════════════════════════════════════════
// BOOKING ADVANCED APIs (Phase 7)
// ═══════════════════════════════════════════

export const bookingAdvancedApi = {
  reschedule: (id: string, newDate: string, newTime: string, reason?: string) =>
    api.post(`/bookings/${id}/reschedule`, { newDate, newTime, reason }),
  refund: (id: string, reason: string, amount?: number) =>
    api.post(`/bookings/${id}/refund`, { reason, amount }),
}