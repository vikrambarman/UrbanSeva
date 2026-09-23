import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from '@/lib/auth'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public routes (no auth required)
  const publicRoutes = ['/', '/login', '/verify', '/services', '/property', '/admin/login']
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith('/services/') || pathname.startsWith('/api/')
  )

  if (isPublicRoute) {
    return NextResponse.next()
  }

  // Check for token
  const token = request.cookies.get('token')?.value || 
                request.headers.get('authorization')?.replace('Bearer ', '')

  if (!token) {
    // Redirect to login
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Verify token
  const payload = verifyToken(token)

  if (!payload) {
    // Invalid token, redirect to login
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  // Role-based access control
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