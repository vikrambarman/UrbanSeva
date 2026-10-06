// apps/web/src/app/api/auth/admin-login/route.ts
// CHANGE: Login response mein cookie set ki (Ops login jaisa)
// WHY: Admin login mein bhi cookie set honi chahiye taaki middleware refresh par verify kar sake.
//      Pehle sirf JSON mein token ja raha tha.

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateToken, createSession } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { phone, password } = body

    if (!phone || !password) {
      return NextResponse.json(
        { success: false, error: 'Phone and password are required' },
        { status: 400 }
      )
    }

    // Find admin user
    const user = await db.user.findUnique({
      where: { phone },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Check if user is admin
    if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }

    // For now, use simple password check (in production, hash passwords)
    const adminPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'admin123secure'
    
    if (password !== adminPassword) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Update last login
    await db.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        loginCount: { increment: 1 },
      },
    })

    // Generate token
    const token = generateToken({
      userId: user.id,
      role: user.role,
      phone: user.phone,
    })

    // Create session
    await createSession(user.id, token)

    // CHANGE: Response with cookie
    const response = NextResponse.json({
      success: true,
      message: 'Admin login successful',
      data: {
        token,
        user: {
          id: user.id,
          phone: user.phone,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          isVerified: user.isVerified,
        },
      },
    })

    // CHANGE: Set token as cookie for middleware verification on refresh
    response.cookies.set('token', token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    return response

  } catch (error) {
    console.error('Admin Login Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to login' },
      { status: 500 }
    )
  }
}