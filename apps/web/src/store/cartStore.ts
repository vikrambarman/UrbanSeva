/**
 * WHAT: Cart Store with address, coupon, and discount support
 * WHY: Production flow mein address, coupon, discount zaroori hai
 * NOTE: All cart data persisted in localStorage
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
  addressId: string | null
  couponCode: string | null
  discountAmount: number

  // Actions
  addItem: (item: Omit<CartItem, 'id'>) => void
  removeItem: (itemId: string) => void
  updateQuantity: (itemId: string, quantity: number) => void
  updateSchedule: (itemId: string, date: string, time: string) => void
  setAddress: (addressId: string) => void
  clearAddress: () => void
  applyCoupon: (code: string, discount: number) => void
  removeCoupon: () => void
  clearCart: () => void

  // Calculations
  getTotalItems: () => number
  getTotalAmount: () => number
  getFinalAmount: () => number
  getItemById: (itemId: string) => CartItem | undefined
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addressId: null,
      couponCode: null,
      discountAmount: 0,

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

      applyCoupon: (code, discount) => {
        set({ couponCode: code, discountAmount: discount })
      },

      removeCoupon: () => {
        set({ couponCode: null, discountAmount: 0 })
      },

      clearCart: () => set({
        items: [],
        addressId: null,
        couponCode: null,
        discountAmount: 0,
      }),

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

      getFinalAmount: () => {
        const total = get().getTotalAmount()
        const discount = get().discountAmount
        return Math.max(0, total - discount)
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