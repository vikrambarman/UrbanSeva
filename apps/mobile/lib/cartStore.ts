import { create } from 'zustand'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { persist, createJSONStorage } from 'zustand/middleware'

interface CartItem {
  id: string
  serviceId: string
  serviceName: string
  serviceSlug: string
  serviceImage: string | null
  categorySlug: string
  subCategorySlug: string
  selectedPricingLabel: string
  selectedPrice: number
  addOns: Array<{
    id: string
    name: string
    price: number
  }>
  quantity: number
  scheduledDate?: string
  scheduledTime?: string
}

interface CartState {
  items: CartItem[]
  
  // Actions
  addItem: (item: Omit<CartItem, 'id'>) => void
  removeItem: (itemId: string) => void
  updateQuantity: (itemId: string, quantity: number) => void
  updateSchedule: (itemId: string, date: string, time: string) => void
  clearCart: () => void
  
  // Calculations
  getTotalItems: () => number
  getTotalAmount: () => number
  getItemById: (itemId: string) => CartItem | undefined
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        const id = `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        set((state) => ({
          items: [...state.items, { ...item, id }],
        }))
      },

      removeItem: (itemId) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== itemId),
        }))
      },

      updateQuantity: (itemId, quantity) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === itemId ? { ...item, quantity } : item
          ),
        }))
      },

      updateSchedule: (itemId, date, time) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === itemId
              ? { ...item, scheduledDate: date, scheduledTime: time }
              : item
          ),
        }))
      },

      clearCart: () => set({ items: [] }),

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0)
      },

      getTotalAmount: () => {
        return get().items.reduce((total, item) => {
          const addOnsTotal = item.addOns.reduce((sum, addOn) => sum + addOn.price, 0)
          const itemTotal = (item.selectedPrice + addOnsTotal) * item.quantity
          return total + itemTotal
        }, 0)
      },

      getItemById: (itemId) => {
        return get().items.find((item) => item.id === itemId)
      },
    }),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)