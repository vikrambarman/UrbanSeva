import axios from 'axios'
import * as SecureStore from 'expo-secure-store'
import Constants from 'expo-constants'

// API URL — Dev ya Prod
const API_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  Constants.expoConfig?.extra?.apiUrl ||
  'http://localhost:3000'

console.log('API URL:', API_URL)

// Axios instance
export const api = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor — token add karo
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

// Response interceptor — errors handle karo
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync('auth_token')
    }
    return Promise.reject(error)
  }
)

// API Helper functions
export const healthCheck = async () => {
  const res = await api.get('/health')
  return res.data
}
