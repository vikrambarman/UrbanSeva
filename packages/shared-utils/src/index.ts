// ============================================
// PHONE VALIDATION
// ============================================
export const isValidIndianPhone = (phone: string): boolean => {
  const cleaned = phone.replace(/\D/g, '')
  const phoneRegex = /^[6-9]\d{9}$/
  return phoneRegex.test(cleaned)
}

export const formatPhone = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.startsWith('91') && cleaned.length === 12) {
    return cleaned.slice(2)
  }
  return cleaned
}

// ============================================
// CURRENCY FORMATTING
// ============================================
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export const formatCurrencyShort = (amount: number): string => {
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)}L`
  }
  if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(1)}K`
  }
  return `₹${amount}`
}

// ============================================
// DATE FORMATTING
// ============================================
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

export const formatTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

export const getRelativeTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return formatDate(d)
}

// ============================================
// BOOKING HELPERS
// ============================================
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

// ============================================
// STRING HELPERS
// ============================================
export const generateBookingNumber = (): string => {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `BK${timestamp}${random}`
}

export const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export const truncate = (text: string, length: number): string => {
  if (text.length <= length) return text
  return `${text.substring(0, length)}...`
}

export const capitalizeFirst = (text: string): string => {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
}

// ============================================
// VALIDATION HELPERS
// ============================================
export const isValidPincode = (pincode: string): boolean => {
  return /^[1-9][0-9]{5}$/.test(pincode)
}

export const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// ============================================
// STORAGE KEYS (Same for Web + Mobile)
// ============================================
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_DATA: 'user_data',
  ONBOARDING_DONE: 'onboarding_done',
  SELECTED_ADDRESS: 'selected_address',
  THEME: 'theme',
} as const

// ============================================
// APP CONSTANTS
// ============================================
export const APP_CONSTANTS = {
  APP_NAME: 'ServiceApp',
  APP_TAGLINE: 'Your City, Your Services',
  CITY: 'Ambikapur',
  STATE: 'Chhattisgarh',
  PLATFORM_FEE_PERCENT: 15,
  MIN_BOOKING_AMOUNT: 99,
  OTP_LENGTH: 6,
  OTP_EXPIRY_SECONDS: 300,
  MAX_ADDRESSES: 5,
  SUPPORT_PHONE: '+91-XXXXXXXXXX',
  SUPPORT_EMAIL: 'support@serviceapp.com',
} as const