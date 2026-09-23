import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { redis } from '@/lib/redis'
import { getSMSProvider, generateOTP } from '@/lib/sms'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { phone } = body

        // Validate phone
        if (!phone || !/^\d{10}$/.test(phone)) {
            return NextResponse.json(
                { success: false, error: 'Invalid phone number' },
                { status: 400 }
            )
        }

        // Check rate limiting (max 3 OTP requests per 10 minutes)
        const rateLimitKey = `otp_rate_limit:${phone}`
        const attempts = await redis.get(rateLimitKey)

        if (attempts && parseInt(attempts) >= 3) {
            return NextResponse.json(
                { success: false, error: 'Too many OTP requests. Please try again after 10 minutes.' },
                { status: 429 }
            )
        }

        // Generate OTP
        const otp = generateOTP(6)
        const otpExpiry = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes

        // Store OTP in database
        await db.oTPVerification.create({
            data: {
                phone,
                otp,
                expiresAt: otpExpiry,
            },
        })

        // Send OTP via SMS
        const smsProvider = getSMSProvider()
        const smsResult = await smsProvider.sendOTP(phone, otp)

        if (!smsResult.success) {
            // If SMS fails, still create OTP for testing (remove in production)
            console.log(`[DEV MODE] OTP for ${phone}: ${otp}`)
        }

        // Update rate limiting
        await redis.set(rateLimitKey, ((attempts ? parseInt(attempts) : 0) + 1).toString(), 'EX', 600) // 10 minutes

        return NextResponse.json({
            success: true,
            message: 'OTP sent successfully',
            // In development, return OTP for testing
            ...(process.env.NODE_ENV === 'development' && { devOtp: otp }),
        })
    } catch (error) {
        console.error('Send OTP Error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to send OTP' },
            { status: 500 }
        )
    }
}