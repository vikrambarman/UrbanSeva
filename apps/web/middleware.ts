// apps/web/src/middleware.ts
// CHANGE: Debug logs add kiye cookie verification ke liye
// CHANGE: /api/ops/* routes ko bhi ops protection mein add kiya
// WHY: Refresh par login redirect ho raha tha. Ab console mein dikhega ki cookie mil rahi hai ya nahi.

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from '@/lib/auth'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ═══════════════════════════════════════════════════════════════
  // Public routes (no auth required)
  // ═══════════════════════════════════════════════════════════════
  const publicRoutes = ['/', '/login', '/verify', '/services', '/property', '/admin-login', '/ops/login']
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith('/services/') || pathname.startsWith('/api/')
  )

  if (isPublicRoute) {
    return NextResponse.next()
  }

  // ═══════════════════════════════════════════════════════════════
  // NEW: Ops portal routes — /ops/* (except /ops/login)
  // ═══════════════════════════════════════════════════════════════
  if (pathname.startsWith('/ops')) {
    // CHANGE: Debug logs for cookie verification
    const tokenFromCookie = request.cookies.get('token')?.value
    const tokenFromHeader = request.headers.get('authorization')?.replace('Bearer ', '')
    const token = tokenFromCookie || tokenFromHeader

    console.log('🔍 Ops Middleware Debug:')
    console.log('  - Pathname:', pathname)
    console.log('  - Token from cookie:', tokenFromCookie ? '✅ Present' : '❌ Missing')
    console.log('  - Token from header:', tokenFromHeader ? '✅ Present' : '❌ Missing')

    if (!token) {
      console.log('  ⚠️ No token found, redirecting to /ops/login')
      return NextResponse.redirect(new URL('/ops/login', request.url))
    }

    const payload = verifyToken(token)
    console.log('  - Token verification:', payload ? '✅ Valid' : '❌ Invalid')

    if (!payload) {
      console.log('  ⚠️ Invalid token, redirecting to /ops/login')
      return NextResponse.redirect(new URL('/ops/login', request.url))
    }

    // Sirf CALLING_TEAM, ADMIN, SUPER_ADMIN access kar sakte hain
    if (payload.role !== 'CALLING_TEAM' && payload.role !== 'ADMIN' && payload.role !== 'SUPER_ADMIN') {
      console.log('  ⚠️ Invalid role:', payload.role, '- redirecting to /login')
      return NextResponse.redirect(new URL('/login', request.url))
    }

    console.log('  ✅ Access granted for role:', payload.role)
    return NextResponse.next()
  }

  // ═══════════════════════════════════════════════════════════════
  // Existing: Check for token (for other routes)
  // ═══════════════════════════════════════════════════════════════
  const token = request.cookies.get('token')?.value || 
                request.headers.get('authorization')?.replace('Bearer ', '')

  if (!token) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  const payload = verifyToken(token)

  if (!payload) {
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  const role = payload.role

  // Admin routes
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  // Provider routes
  if (pathname.startsWith('/provider')) {
    if (role !== 'PROVIDER') {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  // Customer routes (bookings, profile, etc.)
  if (pathname.startsWith('/customer') || pathname.startsWith('/booking')) {
    if (role !== 'CUSTOMER' && role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}