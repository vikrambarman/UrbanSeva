/**
 * WHAT: Cart Store with address support
 * WHY: Production flow mein address selection zaroori hai before checkout
 * NOTE: Added addressId field for address selection
 */

'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface CartItem {
  id: string // Unique ID for cart item
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
  addressId: string | null // NEW: Selected address ID
  
  // Actions
  addItem: (item: Omit<CartItem, 'id'>) => void
  removeItem: (itemId: string) => void
  updateQuantity: (itemId: string, quantity: number) => void
  updateSchedule: (itemId: string, date: string, time: string) => void
  setAddress: (addressId: string) => void // NEW: Set address
  clearAddress: () => void // NEW: Clear address
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
      addressId: null, // NEW: Initialize address

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

      setAddress: (addressId) => {
        set({ addressId })
      },

      clearAddress: () => {
        set({ addressId: null })
      },

      clearCart: () => set({ items: [], addressId: null }),

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
    }
  )
)