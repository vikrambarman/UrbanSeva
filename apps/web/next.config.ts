import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // ✅ FIX: Ngrok domain ko allowed origins mein add karo
  allowedDevOrigins: [
    '192.168.29.115',
    'congress-prominent-reviving.ngrok-free.dev', // ✅ Tumhara current ngrok URL
  ],

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.r2.cloudflarestorage.com',
      },
      {
        protocol: 'https',
        hostname: '*.cloudflare.com',
      },
      {
        protocol: 'https',
        hostname: 'maps.googleapis.com',
      },
      // ✅ FIX: Agar tum local uploads ko ngrok ke through serve kar rahe ho, toh ye add karo
      {
        protocol: 'https',
        hostname: 'congress-prominent-reviving.ngrok-free.dev',
      },
    ],
  },

  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Cache-Control', value: 'private, no-cache, no-store, must-revalidate' },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          // ️ FIX: Static assets ke liye cache-control thoda relax karo testing ke liye
          // { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }, 
        ],
      },

      {
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },

      {
        source: '/images/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400' },
        ],
      },
    ]
  },

  transpilePackages: [
    '@homeservices/shared-types',
    '@homeservices/shared-utils',
  ],
}

export default nextConfig