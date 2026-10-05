import type { MetadataRoute } from 'next'
import { SITE_CONFIG } from '@/lib/config'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin',
          '/admin/',
          '/provider',
          '/provider/',
          '/customer',
          '/customer/',
          '/booking/',
          '/cart',
          '/login',
          '/register',
          '/verify',
          '/admin-login',
          '/provider-login',
          '/provider-forgot-password',
          '/my-bookings',
          '/addresses',
          '/wallet',
          '/referral',
          '/profile',
        ],
      },
    ],
    sitemap: `${baseUrl(SITE_CONFIG.url)}/sitemap.xml`,
  }
}

function baseUrl(url: string) {
  return url.replace(/\/$/, '')
}