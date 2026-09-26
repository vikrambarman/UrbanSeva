// src/app/api/auth/forgot-password/send-otp/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSMSProvider, generateOTP } from '@/lib/sms'

export async function POST(request: NextRequest) {
    try {
        const { phone, role } = await request.json()

        if (!phone || phone.length !== 10) {
            return NextResponse.json(
                { success: false, error: 'Valid phone number required' },
                { status: 400 }
            )
        }

        // Check if user exists
        const user = await db.user.findUnique({
            where: { phone },
            select: { id: true, role: true, name: true }
        })

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Phone number not registered' },
                { status: 404 }
            )
        }

        // Validate role
        if (role && user.role !== role) {
            return NextResponse.json(
                { success: false, error: `This number is not registered as a ${role.toLowerCase()}` },
                { status: 403 }
            )
        }

        // Generate OTP
        const otp = generateOTP(6)

        // Delete old OTPs
        await db.oTPVerification.deleteMany({
            where: { phone }
        })

        // Save OTP (expires in 10 minutes)
        await db.oTPVerification.create({
            data: {
                phone,
                otp,
                expiresAt: new Date(Date.now() + 10 * 60 * 1000),
                isUsed: false
            }
        })

        // ✅ DEVELOPMENT MODE - Show OTP in console
        if (process.env.NODE_ENV === 'development') {
            console.log(`\n🔐 ========== PASSWORD RESET OTP ==========`)
            console.log(`Phone: ${phone}`)
            console.log(`OTP: ${otp}`)
            console.log(`Expires: ${new Date(Date.now() + 10 * 60 * 1000).toLocaleString()}`)
            console.log(`==========================================\n`)

            return NextResponse.json({
                success: true,
                message: 'OTP sent (check console in dev mode)',
                otp // Only in development
            })
        }

        // ✅ PRODUCTION MODE - Send SMS
        try {
            const smsProvider = getSMSProvider()
            const result = await smsProvider.sendOTP(phone, otp)

            if (!result.success) {
                console.error('SMS send failed:', result.error)
                // Fallback to development mode
                return NextResponse.json({
                    success: true,
                    message: 'OTP generated (SMS failed, check console)',
                    otp // Temporary fallback
                })
            }

            return NextResponse.json({
                success: true,
                message: 'OTP sent to your phone'
            })

        } catch (smsError) {
            console.error('SMS Error:', smsError)
            // Fallback
            return NextResponse.json({
                success: true,
                message: 'OTP generated (check console)',
                otp // Fallback for dev
            })
        }

    } catch (error) {
        console.error('Send OTP Error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to send OTP' },
            { status: 500 }
        )
    }
}