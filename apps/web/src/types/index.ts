// ═══════════════════
// BASE TYPES
// ═══════════════════

export type UserRole = 'CUSTOMER' | 'PROVIDER' | 'ADMIN' | 'SUPER_ADMIN' | 'CALLING_TEAM'
export type LoyaltyTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM'

// ═══════════════════
// UPDATED: Booking Status - Production Flow
// ═══════════════════
export type BookingStatus =
  // Legacy
  | 'PENDING' 
  | 'CONFIRMED'
  // New Production Flow
  | 'PAYMENT_RECEIVED'
  | 'PENDING_CONFIRMATION'
  | 'RESCHEDULE_PENDING'
  // Service Execution
  | 'PROVIDER_ASSIGNED'
  | 'PROVIDER_TRAVELLING'
  | 'SERVICE_STARTED'
  | 'SERVICE_COMPLETED'
  // Terminal States
  | 'CANCELLED'
  | 'CANCELLED_BY_CUSTOMER'
  | 'CANCELLED_BY_OPS'
  | 'CANCELLED_BY_PROVIDER'
  | 'NO_SHOW'
  | 'FAILED'
  | 'REFUND_INITIATED'
  | 'REFUNDED'

// ═══════════════════
// UPDATED: Payment Status
// ═══════════════════
export type PaymentStatus =
  | 'PENDING' 
  | 'PAID' 
  | 'FAILED'
  | 'REFUND_INITIATED'
  | 'REFUNDED' 
  | 'PARTIALLY_REFUNDED'

export type PriceType =
  | 'FIXED' | 'STARTING_AT' | 'PER_SQFT' | 'CUSTOM_QUOTE'

// ═══════════════════
// USER TYPES
// ═══════════════════

export interface User {
  id: string
  phone: string
  name: string | null
  email: string | null
  avatar: string | null
  role: UserRole
  isActive: boolean
  isVerified: boolean
  walletBalance: number
  loyaltyPoints: number
  loyaltyTier: LoyaltyTier
  referralCode: string
  createdAt: Date
  updatedAt: Date
}

// ═══════════════════
// ADDRESS TYPES
// ═══════════════════

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

// ═══════════════════
// CATEGORY TYPES
// ═══════════════════

export interface Category {
  id: string
  name: string
  slug: string
  image: string | null
  icon: string | null
  description: string | null
  sortOrder: number
  isActive: boolean
  gstEnabled: boolean
  gstPercentage: number
  createdAt: Date
}

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

export interface CategoryWithSubs extends Category {
  subCategories: SubCategory[]
}

// ═══════════════════
// SERVICE TYPES
// ═══════════════════

export interface ServiceInclusion {
  id: string
  serviceId: string
  text: string
  sortOrder: number
}

export interface ServiceExclusion {
  id: string
  serviceId: string
  text: string
  sortOrder: number
}

export interface ServicePricing {
  id: string
  serviceId: string
  label: string
  price: number
  duration: string | null
  sortOrder: number
}

export interface ServiceAddOn {
  id: string
  serviceId: string
  name: string
  price: number
  description: string | null
}

export interface ServiceFAQ {
  id: string
  serviceId: string
  question: string
  answer: string
  sortOrder: number
}

export interface Service {
  id: string
  subCategoryId: string
  name: string
  slug: string
  description: string
  image: string | null
  basePrice: number
  priceType: PriceType
  duration: string
  professionals: number
  guarantee: string | null
  isActive: boolean
  isTrending: boolean
  isFeatured: boolean
  avgRating: number
  totalReviews: number
  createdAt: Date
  updatedAt: Date
}

export interface ServiceWithDetails extends Service {
  subCategory: SubCategory & {
    category: Category
  }
  inclusions: ServiceInclusion[]
  exclusions: ServiceExclusion[]
  pricingTiers: ServicePricing[]
  addOns: ServiceAddOn[]
  faqs: ServiceFAQ[]
}

// ═══════════════════
// UPDATED: BOOKING TYPES
// ═══════════════════

export interface Booking {
  id: string
  bookingNumber: string
  userId: string
  providerId: string | null
  serviceId: string
  addressId: string
  pricingLabel: string | null
  addOns: any | null
  scheduledDate: Date
  scheduledTime: string
  status: BookingStatus
  baseAmount: number
  addOnAmount: number
  discountAmount: number
  couponCode: string | null
  totalAmount: number
  gstAmount: number
  paymentStatus: PaymentStatus
  paymentMethod: string | null
  razorpayOrderId: string | null
  razorpayPaymentId: string | null
  razorpayPaymentLinkId: string | null
  razorpayPaymentLinkUrl: string | null
  codAmountCollected: number | null
  codVerifiedBy: string | null
  codVerifiedAt: Date | null
  codDisputed: boolean
  specialInstructions: string | null
  createdAt: Date
  updatedAt: Date
}

export interface BookingWithAll extends Booking {
  user: User
  service: Service
  address: Address
  provider?: Provider
}

// ═══════════════════
// NEW: PROVIDER TYPES
// ═══════════════════

export interface Provider {
  id: string
  userId: string
  bio: string | null
  experience: number
  avgRating: number
  totalJobs: number
  totalEarnings: number
  isAvailable: boolean
  status: string
  currentWorkStatus?: string
  currentJobId?: string | null
}

// ═══════════════════
// REVIEW TYPES
// ═══════════════════

export interface Review {
  id: string
  bookingId: string
  userId: string
  serviceId: string
  overallRating: number
  comment: string | null
  createdAt: Date
}

// ═══════════════════
// ADDON ITEM (Booking Store)
// ═══════════════════

export interface AddOnItem {
  id: string
  name: string
  price: number
  description?: string | null
}

// ═══════════════════
// SEARCH + FILTERS
// ═══════════════════

export interface SearchFilters {
  query?: string
  category?: string
  subcategory?: string
  minPrice?: number
  maxPrice?: number
  rating?: number
  sortBy?: 'price' | 'rating' | 'popularity'
}

// ═══════════════════
// API RESPONSE
// ═══════════════════

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

// ═══════════════════
// NAV TYPES
// ═══════════════════

export interface NavItem {
  label: string
  href: string
  icon?: string
  badge?: number
}