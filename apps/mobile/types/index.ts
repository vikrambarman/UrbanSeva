// ═══════════════════════════════
// CATEGORY TYPES
// ═══════════════════════════════

export interface SubCategory {
  id: string
  categoryId: string
  name: string
  slug: string
  image: string | null
  description: string | null
  sortOrder: number
  isActive: boolean
}

export interface Category {
  id: string
  name: string
  slug: string
  icon: string | null
  image: string | null
  description: string | null
  sortOrder: number
  isActive: boolean
  createdAt: string
  subCategories?: SubCategory[]
}

// ═══════════════════════════════
// SERVICE TYPES
// ═══════════════════════════════

export interface Service {
  id: string
  name: string
  slug: string
  description: string
  image: string | null
  basePrice: number
  priceType: 'FIXED' | 'STARTING_AT' | 'PER_SQFT' | 'CUSTOM_QUOTE'
  duration: string
  professionals: number
  avgRating: number
  totalReviews: number
  isTrending: boolean
  isFeatured: boolean
  subCategory: {
    id: string
    name: string
    slug: string
    category: {
      id: string
      name: string
      slug: string
      icon: string | null
    }
  }
}

// ═══════════════════════════════
// USER TYPES
// ═══════════════════════════════

export type UserRole = 'CUSTOMER' | 'PROVIDER' | 'ADMIN' | 'SUPER_ADMIN'
export type LoyaltyTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM'

export interface User {
  id: string
  phone: string
  name: string | null
  email: string | null
  avatar: string | null
  role: UserRole
  isVerified: boolean
  walletBalance: number
  loyaltyPoints: number
  loyaltyTier: LoyaltyTier
  referralCode: string
}

// ═══════════════════════════════
// BOOKING TYPES
// ═══════════════════════════════

export type BookingStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROVIDER_ASSIGNED'
  | 'PROVIDER_TRAVELLING'
  | 'SERVICE_STARTED'
  | 'SERVICE_COMPLETED'
  | 'CANCELLED'
  | 'REFUND_INITIATED'
  | 'REFUNDED'

export type PaymentStatus =
  | 'PENDING'
  | 'PAID'
  | 'FAILED'
  | 'REFUNDED'
  | 'PARTIALLY_REFUNDED'

export interface Booking {
  id: string
  bookingNumber: string
  serviceId: string
  status: BookingStatus
  paymentStatus: PaymentStatus
  scheduledDate: string
  scheduledTime: string
  baseAmount: number
  totalAmount: number
  couponCode: string | null
  discountAmount: number
  specialInstructions: string | null
  createdAt: string
  service?: Service
}

// ═══════════════════════════════
// ADDRESS TYPES
// ═══════════════════════════════

export interface Address {
  id: string
  userId: string
  label: string
  fullAddress: string
  area: string
  landmark: string | null
  pincode: string
  latitude: number | null
  longitude: number | null
  isDefault: boolean
}

// ═══════════════════════════════
// API RESPONSE
// ═══════════════════════════════

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}