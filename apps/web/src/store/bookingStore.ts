/**
 * WHAT: Booking Store with payment method support
 * WHY: Production flow mein payment method selection zaroori hai (ONLINE/COD)
 * NOTE: Added paymentMethod field
 */

import { create } from 'zustand'

interface AddOnItem {
  id: string
  name: string
  price: number
  description?: string | null
}

interface ServiceInfo {
  serviceId: string
  serviceName: string
  categorySlug: string
  subCategorySlug: string
  serviceSlug: string
  basePrice: number
}

interface BookingState {
  serviceId: string | null
  serviceName: string | null
  categorySlug: string | null
  subCategorySlug: string | null
  serviceSlug: string | null
  basePrice: number
  selectedPricingLabel: string | null
  selectedPrice: number
  selectedAddOns: AddOnItem[]
  scheduledDate: Date | null
  scheduledTime: string | null
  addressId: string | null
  couponCode: string | null
  discountAmount: number
  totalAmount: number
  paymentMethod: 'ONLINE' | 'COD' | null // NEW: Payment method
  currentStep: number

  setService: (info: ServiceInfo) => void
  setPricing: (label: string, price: number) => void
  addAddOn: (addOn: AddOnItem) => void
  removeAddOn: (addOnId: string) => void
  setSchedule: (date: Date, time: string) => void
  setAddress: (addressId: string) => void
  applyCoupon: (code: string, discount: number) => void
  removeCoupon: () => void
  setPaymentMethod: (method: 'ONLINE' | 'COD') => void // NEW: Set payment method
  setStep: (step: number) => void
  calculateTotal: () => void
  clearBooking: () => void
}

export const useBookingStore = create<BookingState>((set, get) => ({
  serviceId: null,
  serviceName: null,
  categorySlug: null,
  subCategorySlug: null,
  serviceSlug: null,
  basePrice: 0,
  selectedPricingLabel: null,
  selectedPrice: 0,
  selectedAddOns: [],
  scheduledDate: null,
  scheduledTime: null,
  addressId: null,
  couponCode: null,
  discountAmount: 0,
  totalAmount: 0,
  paymentMethod: null, // NEW: Initialize payment method
  currentStep: 1,

  setService: (info) =>
    set({
      serviceId: info.serviceId,
      serviceName: info.serviceName,
      categorySlug: info.categorySlug,
      subCategorySlug: info.subCategorySlug,
      serviceSlug: info.serviceSlug,
      basePrice: info.basePrice,
      selectedPrice: info.basePrice,
      selectedAddOns: [],
      couponCode: null,
      discountAmount: 0,
    }),

  setPricing: (label, price) => {
    set({ selectedPricingLabel: label, selectedPrice: price })
    get().calculateTotal()
  },

  addAddOn: (addOn) => {
    const existing = get().selectedAddOns
    if (!existing.find((a) => a.id === addOn.id)) {
      set({ selectedAddOns: [...existing, addOn] })
      get().calculateTotal()
    }
  },

  removeAddOn: (addOnId) => {
    set({
      selectedAddOns: get().selectedAddOns.filter(
        (a) => a.id !== addOnId
      ),
    })
    get().calculateTotal()
  },

  setSchedule: (date, time) =>
    set({ scheduledDate: date, scheduledTime: time }),

  setAddress: (addressId) => set({ addressId }),

  applyCoupon: (code, discount) => {
    set({ couponCode: code, discountAmount: discount })
    get().calculateTotal()
  },

  removeCoupon: () => {
    set({ couponCode: null, discountAmount: 0 })
    get().calculateTotal()
  },

  setPaymentMethod: (method) => {
    set({ paymentMethod: method })
  },

  setStep: (step) => set({ currentStep: step }),

  calculateTotal: () => {
    const state = get()
    const addOnTotal = state.selectedAddOns.reduce(
      (sum, a) => sum + a.price,
      0
    )
    const subtotal = state.selectedPrice + addOnTotal
    const total = Math.max(0, subtotal - state.discountAmount)
    set({ totalAmount: total })
  },

  clearBooking: () =>
    set({
      serviceId: null,
      serviceName: null,
      categorySlug: null,
      subCategorySlug: null,
      serviceSlug: null,
      basePrice: 0,
      selectedPricingLabel: null,
      selectedPrice: 0,
      selectedAddOns: [],
      scheduledDate: null,
      scheduledTime: null,
      addressId: null,
      couponCode: null,
      discountAmount: 0,
      totalAmount: 0,
      paymentMethod: null, // NEW: Reset payment method
      currentStep: 1,
    }),
}))