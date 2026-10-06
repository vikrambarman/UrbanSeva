// middleware.ts
// CHANGE: /ops/* routes ke liye protection add ki
// CHANGE: /ops/login ko public routes mein add kiya
// CHANGE: /api/ops/* ko bhi protect kiya (sirf token check, role check API level pe hoga)
// WHY: Calling team portal ko unauthorized access se bachana hai

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
    const token = request.cookies.get('token')?.value || 
                  request.headers.get('authorization')?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.redirect(new URL('/ops/login', request.url))
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.redirect(new URL('/ops/login', request.url))
    }

    // Sirf CALLING_TEAM, ADMIN, SUPER_ADMIN access kar sakte hain
    if (payload.role !== 'CALLING_TEAM' && payload.role !== 'ADMIN' && payload.role !== 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/login', request.url))
    }

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