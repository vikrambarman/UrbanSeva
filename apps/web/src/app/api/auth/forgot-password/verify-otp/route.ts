// src/app/api/auth/forgot-password/verify-otp/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
    try {
        const { phone, otp } = await request.json()

        if (!phone || !otp) {
            return NextResponse.json(
                { success: false, error: 'Phone and OTP required' },
                { status: 400 }
            )
        }

        // Find OTP
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

        // ✅ Development log
        if (process.env.NODE_ENV === 'development') {
            console.log(`✅ OTP Verified for ${phone}`)
        }

        return NextResponse.json({
            success: true,
            message: 'OTP verified successfully'
        })

    } catch (error) {
        console.error('Verify OTP Error:', error)
        return NextResponse.json(
            { success: false, error: 'Verification failed' },
            { status: 500 }
        )
    }
}