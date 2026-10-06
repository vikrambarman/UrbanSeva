// apps/web/src/app/api/ops/auth/login/route.ts
// CHANGE: Login response mein http-only cookie set ki
// CHANGE: Token ko cookie mein bhi store kiya (7 days expiry)
// WHY: Middleware token cookie se verify karta hai. Pehle sirf JSON mein token ja raha tha,
//      isliye page refresh par middleware ko cookie nahi milti thi aur login par redirect ho jata tha.

import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { generateToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { phone, password } = body

        // ═══════════════════════════════════════════════════════════════
        // Validation
        // ═══════════════════════════════════════════════════════════════
        if (!phone || !password) {
            return NextResponse.json(
                { success: false, error: 'Phone and password are required' },
                { status: 400 }
            )
        }

        // Phone format check (10 digits)
        const cleanPhone = phone.replace(/\D/g, '')
        if (cleanPhone.length !== 10) {
            return NextResponse.json(
                { success: false, error: 'Invalid phone number' },
                { status: 400 }
            )
        }

        // ═══════════════════════════════════════════════════════════════
        // Find user with CALLING_TEAM role
        // ═══════════════════════════════════════════════════════════════
        const user = await db.user.findFirst({
            where: {
                phone: cleanPhone,
                role: 'CALLING_TEAM',
            }
        })

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Invalid credentials' },
                { status: 401 }
            )
        }

        // ═══════════════════════════════════════════════════════════════
        // Check if user is active
        // ═══════════════════════════════════════════════════════════════
        if (!user.isActive) {
            return NextResponse.json(
                { success: false, error: 'Account is deactivated. Contact admin.' },
                { status: 403 }
            )
        }

        // ═══════════════════════════════════════════════════════════════
        // Verify password
        // ═══════════════════════════════════════════════════════════════
        if (!user.password) {
            return NextResponse.json(
                { success: false, error: 'Password not set. Contact admin.' },
                { status: 403 }
            )
        }

        const isPasswordValid = await bcrypt.compare(password, user.password)
        if (!isPasswordValid) {
            return NextResponse.json(
                { success: false, error: 'Invalid credentials' },
                { status: 401 }
            )
        }

        // ═══════════════════════════════════════════════════════════════
        // Get assigned categories for this staff member
        // ═══════════════════════════════════════════════════════════════
        const staffCategories = await db.staffCategory.findMany({
            where: { userId: user.id },
            include: {
                category: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                    }
                }
            }
        })

        const categories = staffCategories.map(sc => ({
            id: sc.category.id,
            name: sc.category.name,
            slug: sc.category.slug,
        }))

        // ═══════════════════════════════════════════════════════════════
        // Generate JWT token
        // ═══════════════════════════════════════════════════════════════
        const token = generateToken({
            userId: user.id,
            role: user.role,
            phone: user.phone,
        })

        // ═══════════════════════════════════════════════════════════════
        // Update login tracking
        // ═══════════════════════════════════════════════════════════════
        await db.user.update({
            where: { id: user.id },
            data: {
                lastLoginAt: new Date(),
                loginCount: { increment: 1 },
            }
        })

        // ═══════════════════════════════════════════════════════════════
        // Response with cookie
        // ═══════════════════════════════════════════════════════════════
        const response = NextResponse.json({
            success: true,
            message: 'Login successful',
            data: {
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    phone: user.phone,
                    email: user.email,
                    role: user.role,
                    avatar: user.avatar,
                    categories, // Assigned categories — frontend ko chahiye
                }
            }
        })

        // CHANGE: Set token as cookie so middleware can verify on page refresh
        response.cookies.set('token', token, {
            httpOnly: false, // Frontend ko bhi read karna hai
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 7, // 7 days
        })

        return response

    } catch (error) {
        console.error('❌ Ops login error:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}