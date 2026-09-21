// ============================================
// USER TYPES
// ============================================
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

export interface Customer extends User {
  role: 'customer'
  addresses: Address[]
  bookings: Booking[]
  walletBalance: number
}

export interface Provider extends User {
  role: 'provider'
  businessName: string | null
  services: string[]
  rating: number
  totalJobs: number
  isApproved: boolean
  earnings: number
}

// ============================================
// ADDRESS TYPES
// ============================================
export interface Address {
  id: string
  userId: string
  label: string          // 'Home', 'Work', 'Other'
  fullAddress: string
  landmark: string | null
  city: string
  pincode: string
  latitude: number | null
  longitude: number | null
  isDefault: boolean
}

// ============================================
// SERVICE TYPES
// ============================================
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
  duration: number       // minutes
  unit: string           // 'per visit', 'per hour'
  imageUrl: string | null
  isActive: boolean
  rating: number
  totalBookings: number
}

// ============================================
// BOOKING TYPES
// ============================================
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

// ============================================
// PAYMENT TYPES
// ============================================
export type PaymentMethod =
  | 'upi'
  | 'card'
  | 'netbanking'
  | 'wallet'
  | 'cash'

export interface Payment {
  id: string
  bookingId: string
  amount: number
  method: PaymentMethod
  status: PaymentStatus
  razorpayOrderId: string | null
  razorpayPaymentId: string | null
  createdAt: Date
}

// ============================================
// API RESPONSE TYPES
// ============================================
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

// ============================================
// OTP / AUTH TYPES
// ============================================
export interface OtpRequest {
  phone: string
}

export interface OtpVerify {
  phone: string
  otp: string
}

export interface AuthResponse {
  token: string
  user: User
  isNewUser: boolean
}

// ============================================
// NOTIFICATION TYPES
// ============================================
export type NotificationType =
  | 'booking_confirmed'
  | 'booking_assigned'
  | 'provider_arrived'
  | 'booking_completed'
  | 'booking_cancelled'
  | 'payment_success'
  | 'otp'

export interface Notification {
  id: string
  userId: string
  type: NotificationType
  title: string
  message: string
  isRead: boolean
  data: Record<string, unknown>
  createdAt: Date
}

// ============================================
// REVIEW TYPES
// ============================================
export interface Review {
  id: string
  bookingId: string
  customerId: string
  providerId: string
  rating: number         // 1-5
  comment: string | null
  createdAt: Date
}