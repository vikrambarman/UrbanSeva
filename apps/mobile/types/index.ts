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
// ═══════════════════════════════
// SERVICE DETAIL TYPES (Phase 4)
// ═══════════════════════════════

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

export interface ProviderInfo {
  id: string
  avgRating: number
  totalJobs: number
  experience: number
  user: {
    id: string
    name: string | null
    avatar: string | null
  }
}

export interface ServiceDetail extends Service {
  inclusions: ServiceInclusion[]
  exclusions: ServiceExclusion[]
  pricingTiers: ServicePricing[]
  addOns: ServiceAddOn[]
  faqs: ServiceFAQ[]
  guarantee: string | null
  providerServices: Array<{
    id: string
    isActive: boolean
    customPrice: number | null
    provider: ProviderInfo
  }>
}


// ═══════════════════════════════════════════
// PROVIDER TYPES (Phase 7)
// ═══════════════════════════════════════════

export interface ProviderProfile {
  id: string
  userId: string
  bio: string | null
  experience: number
  aadharNumber: string | null
  panNumber: string | null
  aadharImage: string | null
  panImage: string | null
  policeVerified: boolean
  portfolioImages: string[]
  bankAccount: string | null
  bankIFSC: string | null
  bankName: string | null
  upiId: string | null
  commissionRate: number
  status: 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'SUSPENDED'
  avgRating: number
  totalJobs: number
  totalEarnings: number
  isAvailable: boolean
  serviceAreas: string[]
  createdAt: string
  updatedAt: string
  user: {
    name: string | null
    phone: string
    email: string | null
    avatar: string | null
  }
  services?: Array<{
    id: string
    service: { name: string; image: string | null }
  }>
  availability?: Array<{
    id: string
    dayOfWeek: number
    startTime: string
    endTime: string
    isAvailable: boolean
  }>
}

export interface ProviderJob {
  id: string
  bookingNumber: string
  status: BookingStatus
  scheduledDate: string
  scheduledTime: string
  totalAmount: number
  baseAmount: number
  addOnAmount: number
  specialInstructions?: string
  startedAt?: string
  completedAt?: string
  user: { name: string | null; phone: string }
  service: { name: string; image: string | null; duration: string }
  address: { fullAddress: string; area: string; landmark?: string }
  review?: { overallRating: number; comment?: string }
}

export interface ProviderEarning {
  id: string
  gross: number
  commission: number
  net: number
  status: 'PENDING' | 'SETTLED' | 'PAYOUT_INITIATED' | 'PAID'
  createdAt: string
}

export interface ProviderPayout {
  id: string
  amount: number
  method: string
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
  reference: string | null
  processedAt: string | null
  createdAt: string
}

export interface ProviderReview {
  id: string
  overallRating: number
  punctualityRating: number | null
  qualityRating: number | null
  behaviourRating: number | null
  valueRating: number | null
  comment: string | null
  photos: string[]
  providerReply: string | null
  createdAt: string
  user: { name: string | null; avatar: string | null }
  service: { name: string }
  booking: { bookingNumber: string }
}

// ═══════════════════════════════════════════
// ADMIN TYPES (Phase 7)
// ═══════════════════════════════════════════

export interface AdminDashboardStats {
  totalUsers: number
  totalProviders: number
  totalBookings: number
  totalRevenue: number
  pendingBookings: number
  recentBookings: Booking[]
}

export interface AdminUser {
  id: string
  name: string | null
  phone: string
  email: string | null
  avatar: string | null
  role: UserRole
  isActive: boolean
  isVerified: boolean
  createdAt: string
  walletBalance: number
  loyaltyTier: LoyaltyTier
  _count: { bookings: number; reviews: number }
}

export interface AdminProvider {
  id: string
  status: string
  avgRating: number
  totalJobs: number
  totalEarnings: number
  commissionRate: number
  user: { name: string | null; phone: string; email: string | null; avatar: string | null }
  _count?: { services: number; bookings: number }
}

export interface AdminService {
  id: string
  name: string
  slug: string
  image: string | null
  basePrice: number
  isActive: boolean
  isTrending: boolean
  isFeatured: boolean
  subCategory: { name: string; category: { name: string } }
  _count: { bookings: number; reviews: number }
}

export interface FinanceStats {
  totalRevenue: number
  totalBookings: number
  platformCommission: number
  providerEarnings: number
  grossEarnings: number
  totalRefunds: number
  refundCount: number
  pendingPayouts: number
}

export interface AnalyticsSales {
  chartData: Array<{ date: string; revenue: number; bookings: number }>
  summary: {
    totalRevenue: number
    totalBookings: number
    avgOrderValue: number
    period: string
  }
}

export interface AnalyticsServices {
  topServices: Array<{
    id: string
    name: string
    image: string | null
    basePrice: number
    avgRating: number
    _count: { bookings: number; reviews: number }
  }>
  categoryData: Array<{ name: string; bookings: number }>
}

export interface AnalyticsCustomers {
  newUsers: number
  activeUsers: number
  tierDistribution: Array<{ tier: string; count: number }>
  retention: { repeat: number; new: number; retentionRate: number }
}