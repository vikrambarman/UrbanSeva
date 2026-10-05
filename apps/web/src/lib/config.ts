/**
 * Central site configuration — saari business-identity values yahan se aati hain.
 * Business name/tagline/city finalize hone par SIRF .env update karo,
 * kahin bhi hardcoded string dhundne ki zaroorat nahi padegi.
 */
export const SITE_CONFIG = {
  name: process.env.NEXT_PUBLIC_APP_NAME || 'ServiceApp',
  tagline: process.env.NEXT_PUBLIC_APP_TAGLINE || 'Your City, Your Services',
  url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  city: process.env.NEXT_PUBLIC_CITY || 'Ambikapur',

  // Optional — abhi khaali hai, business finalize hone par .env mein add karna
  phone: process.env.NEXT_PUBLIC_BUSINESS_PHONE || '',
  // ✅ NEW
  email: process.env.NEXT_PUBLIC_BUSINESS_EMAIL || '',
  address: process.env.NEXT_PUBLIC_BUSINESS_ADDRESS || '',
  pincode: process.env.NEXT_PUBLIC_BUSINESS_PINCODE || '',

  ogImage: '/og-image.png',
} as const

/** Helper: "<Name> — <City> Home Services" jaisi common title pattern */
export function getSiteTitle() {
  return `${SITE_CONFIG.name} — ${SITE_CONFIG.city} Home Services`
}

/** Helper: common meta description, city ke saath dynamic */
export function getSiteDescription() {
  return `${SITE_CONFIG.city} mein ghar baithe book karo cleaning, electrical, plumbing aur 100+ home services. Verified professionals, fixed pricing, quality guarantee.`
}