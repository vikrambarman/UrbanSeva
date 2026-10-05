export const APP_NAME = 'ServiceApp'
export const APP_TAGLINE = 'Your City, Your Services'
export const CITY = 'Ambikapur'
export const STATE = 'Chhattisgarh'

export const COLORS = {
  // ✅ CHANGED: Orange → Teal (brand color update, home-services ke liye
  // trust/hygiene feel — web ke globals.css ke sath sync kiya hai)
  primary: '#0D9488',
  primaryLight: '#14B8A6',
  primaryDark: '#0F766E',
  // ✅ CHANGED: primaryBg bhi teal ka halka tint, pehle orange tint tha
  primaryBg: '#F0FDFA',
  secondary: '#1E3A5F',
  secondaryLight: '#2563EB',
  background: '#FFFFFF',
  backgroundDark: '#0F172A',
  surface: '#F9FAFB',
  text: '#111827',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  border: '#E5E7EB',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
}
export const BOOKING_STATUS_COLORS = {
  pending: '#F59E0B',
  confirmed: '#3B82F6',
  assigned: '#8B5CF6',
  // ✅ CHANGED: pehle '#F97316' (orange, jo COLORS.primary jaisa hi tha) —
  // isse "in_progress" status aur primary buttons confuse ho sakte the.
  // Ab ek distinct pink/magenta hai jo kisi aur status-color se clash
  // nahi karta, aur primary teal se bhi alag dikhta hai.
  in_progress: '#EC4899',
  completed: '#10B981',
  cancelled: '#EF4444',
  rescheduled: '#6B7280',
}

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_DATA: 'user_data',
  ONBOARDING_DONE: 'onboarding_done',
  THEME: 'theme',
}

export const API_TIMEOUT = 15000
export const OTP_LENGTH = 6
export const OTP_EXPIRY = 300
