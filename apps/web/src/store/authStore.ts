// store/authStore.ts
// CHANGE: User interface mein CALLING_TEAM role add kiya
// CHANGE: categories field add kiya (calling team ke assigned categories ke liye)
// WHY: Ops portal login ke baad user ke paas categories info honi chahiye
//       taaki sirf apni categories ki bookings dikha sake

'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// CHANGE: CALLING_TEAM role add kiya + categories field add kiya
interface User {
  id: string
  phone: string
  name: string | null
  email: string | null
  role: 'CUSTOMER' | 'PROVIDER' | 'ADMIN' | 'SUPER_ADMIN' | 'CALLING_TEAM'
  avatar: string | null
  isVerified: boolean
  categories?: { id: string; name: string; slug: string }[] // Calling team ke liye
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  
  setUser: (user: User, token: string) => void
  logout: () => void
  setLoading: (loading: boolean) => void
  updateUser: (updates: Partial<User>) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      setUser: (user, token) => {
        localStorage.setItem('token', token)
        set({
          user,
          token,
          isAuthenticated: true,
        })
      },

      logout: () => {
        localStorage.removeItem('token')
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        })
      },

      setLoading: (loading) => set({ isLoading: loading }),

      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)