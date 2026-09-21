import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Phone validation
export const isValidIndianPhone = (phone: string): boolean => {
  const cleaned = phone.replace(/\D/g, '')
  return /^[6-9]\d{9}$/.test(cleaned)
}

// Currency formatting
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

// Date formatting
export const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d)
}

export const formatDateTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

// Booking status
export const getBookingStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    pending: '#F59E0B',
    confirmed: '#3B82F6',
    assigned: '#8B5CF6',
    in_progress: '#F97316',
    completed: '#10B981',
    cancelled: '#EF4444',
    rescheduled: '#6B7280',
  }
  return colors[status] || '#6B7280'
}

export const getBookingStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    assigned: 'Provider Assigned',
    in_progress: 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
    rescheduled: 'Rescheduled',
  }
  return labels[status] || status
}

// App constants
export const APP_CONSTANTS = {
  APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || 'ServiceApp',
  APP_TAGLINE: process.env.NEXT_PUBLIC_APP_TAGLINE || 'Your City, Your Services',
  CITY: process.env.NEXT_PUBLIC_CITY || 'Ambikapur',
  PLATFORM_FEE_PERCENT: 15,
  MIN_BOOKING_AMOUNT: 99,
  OTP_LENGTH: 6,
  OTP_EXPIRY_SECONDS: 300,
  MAX_ADDRESSES: 5,
} as const
