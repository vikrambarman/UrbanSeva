import { create } from 'zustand'
import * as SecureStore from 'expo-secure-store'
import { api } from '@/lib/api'

interface User {
  id: string
  phone: string
  name: string | null
  email: string | null
  role: 'CUSTOMER' | 'PROVIDER' | 'ADMIN' | 'SUPER_ADMIN'
  avatar: string | null
  isVerified: boolean
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  isInitialized: boolean
  
  initialize: () => Promise<void>
  setUser: (user: User, token: string) => Promise<void>
  logout: () => Promise<void>
  setLoading: (loading: boolean) => void
  fetchUser: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,

  initialize: async () => {
    try {
      const token = await SecureStore.getItemAsync('auth_token')
      
      if (token) {
        set({ token, isLoading: true })
        
        try {
          const response = await api.get('/auth/me', {
            headers: { Authorization: `Bearer ${token}` }
          })
          
          if (response.data.success) {
            set({
              user: response.data.data,
              isAuthenticated: true,
              isLoading: false,
              isInitialized: true,
            })
          } else {
            await SecureStore.deleteItemAsync('auth_token')
            set({
              token: null,
              user: null,
              isAuthenticated: false,
              isLoading: false,
              isInitialized: true,
            })
          }
        } catch (error) {
          await SecureStore.deleteItemAsync('auth_token')
          set({
            token: null,
            user: null,
            isAuthenticated: false,
            isLoading: false,
            isInitialized: true,
          })
        }
      } else {
        set({ isInitialized: true })
      }
    } catch (error) {
      console.error('Auth initialize error:', error)
      set({ isInitialized: true })
    }
  },

  setUser: async (user, token) => {
    await SecureStore.setItemAsync('auth_token', token)
    set({
      user,
      token,
      isAuthenticated: true,
    })
  },

  logout: async () => {
    try {
      const token = get().token
      if (token) {
        await api.post('/auth/logout', {}, {
          headers: { Authorization: `Bearer ${token}` }
        })
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      await SecureStore.deleteItemAsync('auth_token')
      set({
        user: null,
        token: null,
        isAuthenticated: false,
      })
    }
  },

  setLoading: (loading) => set({ isLoading: loading }),

  fetchUser: async () => {
    const token = get().token
    if (!token) return

    try {
      const response = await api.get('/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (response.data.success) {
        set({ user: response.data.data })
      }
    } catch (error) {
      console.error('Fetch user error:', error)
    }
  },
}))