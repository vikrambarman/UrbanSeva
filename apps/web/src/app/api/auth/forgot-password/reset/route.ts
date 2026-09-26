// src/app/api/auth/forgot-password/reset/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
    try {
        const { phone, otp, password } = await request.json()

        if (!phone || !otp || !password) {
            return NextResponse.json(
                { success: false, error: 'All fields required' },
                { status: 400 }
            )
        }

        if (password.length < 6) {
            return NextResponse.json(
                { success: false, error: 'Password must be at least 6 characters' },
                { status: 400 }
            )
        }

        // Verify OTP
        const otpRecord = await db.oTPVerification.findFirst({
            where: {
                phone,
                otp,
                isUsed: false,
                expiresAt: {
                    gte: new Date()
                }
            }
        })

        if (!otpRecord) {
            return NextResponse.json(
                { success: false, error: 'Invalid or expired OTP' },
                { status: 400 }
            )
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10)

        // Update password and mark OTP as used
        await db.$transaction([
            db.user.update({
                where: { phone },
                data: { password: hashedPassword }
            }),
            db.oTPVerification.update({
                where: { id: otpRecord.id },
                data: { isUsed: true }
            })
        ])

        // ✅ Development log
        if (process.env.NODE_ENV === 'development') {
            console.log(`\n🔒 Password reset successful for ${phone}\n`)
        }

        return NextResponse.json({
            success: true,
            message: 'Password reset successful'
        })

    } catch (error) {
        console.error('Reset Password Error:', error)
        return NextResponse.json(
            { success: false, error: 'Reset failed' },
            { status: 500 }
        )
    }
}