// User Types
export type UserRole = 'customer' | 'provider' | 'admin'

export interface User {
  id: string
  phone: string
  name: string | null
  email: string | null
  role: UserRole
  isVerified: boolean
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

// Booking Types
export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'assigned'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'rescheduled'

export type PaymentStatus =
  | 'pending'
  | 'paid'
  | 'failed'
  | 'refunded'

export type PaymentMethod =
  | 'upi'
  | 'card'
  | 'netbanking'
  | 'wallet'
  | 'cash'

export interface Address {
  id: string
  userId: string
  label: string
  fullAddress: string
  landmark: string | null
  city: string
  pincode: string
  latitude: number | null
  longitude: number | null
  isDefault: boolean
}

export interface ServiceCategory {
  id: string
  name: string
  slug: string
  icon: string
  description: string | null
  isActive: boolean
  sortOrder: number
}

export interface Service {
  id: string
  categoryId: string
  name: string
  slug: string
  description: string
  basePrice: number
  duration: number
  unit: string
  imageUrl: string | null
  isActive: boolean
  rating: number
  totalBookings: number
}

export interface Booking {
  id: string
  bookingNumber: string
  customerId: string
  providerId: string | null
  serviceId: string
  status: BookingStatus
  paymentStatus: PaymentStatus
  scheduledAt: Date
  completedAt: Date | null
  address: Address
  notes: string | null
  amount: number
  platformFee: number
  providerEarning: number
  createdAt: Date
  updatedAt: Date
}

// API Types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

// Auth Types
export interface AuthResponse {
  token: string
  user: User
  isNewUser: boolean
}

// Nav Types
export interface NavItem {
  label: string
  href: string
  icon?: string
  badge?: number
}
