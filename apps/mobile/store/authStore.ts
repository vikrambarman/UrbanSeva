import { create } from 'zustand'
import * as SecureStore from 'expo-secure-store'

interface User {
  id: string
  phone: string
  name: string | null
  role: 'customer' | 'provider' | 'admin'
}

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean

  setUser: (user: User, token: string) => Promise<void>
  logout: () => Promise<void>
  loadFromStorage: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,

  setUser: async (user, token) => {
    await SecureStore.setItemAsync('auth_token', token)
    await SecureStore.setItemAsync('user_data', JSON.stringify(user))
    set({ user, token, isAuthenticated: true })
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('auth_token')
    await SecureStore.deleteItemAsync('user_data')
    set({ user: null, token: null, isAuthenticated: false })
  },

  loadFromStorage: async () => {
    try {
      const token = await SecureStore.getItemAsync('auth_token')
      const userData = await SecureStore.getItemAsync('user_data')

      if (token && userData) {
        set({
          token,
          user: JSON.parse(userData),
          isAuthenticated: true,
          isLoading: false,
        })
      } else {
        set({ isLoading: false })
      }
    } catch {
      set({ isLoading: false })
    }
  },
}))
