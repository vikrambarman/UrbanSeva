import { create } from 'zustand'
import * as SecureStore from 'expo-secure-store'
import { User } from '@/types'
import { STORAGE_KEYS } from '@/constants'

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean

  setUser: (user: User, token: string) => Promise<void>
  logout: () => Promise<void>
  loadFromStorage: () => Promise<void>
  updateUser: (data: Partial<User>) => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,

  setUser: async (user, token) => {
    await SecureStore.setItemAsync(STORAGE_KEYS.AUTH_TOKEN, token)
    await SecureStore.setItemAsync(
      STORAGE_KEYS.USER_DATA,
      JSON.stringify(user)
    )
    set({ user, token, isAuthenticated: true, isLoading: false })
  },

  logout: async () => {
    await SecureStore.deleteItemAsync(STORAGE_KEYS.AUTH_TOKEN)
    await SecureStore.deleteItemAsync(STORAGE_KEYS.USER_DATA)
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    })
  },

  loadFromStorage: async () => {
    try {
      const token = await SecureStore.getItemAsync(STORAGE_KEYS.AUTH_TOKEN)
      const userData = await SecureStore.getItemAsync(STORAGE_KEYS.USER_DATA)

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

  updateUser: (data) => {
    const current = get().user
    if (current) {
      const updated = { ...current, ...data }
      set({ user: updated })
      SecureStore.setItemAsync(
        STORAGE_KEYS.USER_DATA,
        JSON.stringify(updated)
      )
    }
  },
}))
