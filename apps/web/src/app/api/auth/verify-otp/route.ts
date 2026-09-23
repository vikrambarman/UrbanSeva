import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateToken, createSession } from '@/lib/auth'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { phone, otp, role = 'CUSTOMER' } = body

        // Validate inputs
        if (!phone || !otp) {
            return NextResponse.json(
                { success: false, error: 'Phone and OTP are required' },
                { status: 400 }
            )
        }

        // Find latest OTP for this phone
        const otpRecord = await db.oTPVerification.findFirst({
            where: {
                phone,
                isUsed: false,
                expiresAt: { gt: new Date() },
            },
            orderBy: { createdAt: 'desc' },
        })

        if (!otpRecord) {
            return NextResponse.json(
                { success: false, error: 'OTP expired or not found' },
                { status: 400 }
            )
        }

        // Verify OTP
        if (otpRecord.otp !== otp) {
            return NextResponse.json(
                { success: false, error: 'Invalid OTP' },
                { status: 400 }
            )
        }

        // Mark OTP as used
        await db.oTPVerification.update({
            where: { id: otpRecord.id },
            data: { isUsed: true },
        })

        // Find or create user
        let user = await db.user.findUnique({
            where: { phone },
        })

        if (!user) {
            // Create new user
            user = await db.user.create({
                data: {
                    phone,
                    role: role as any,
                    isVerified: true,
                    isActive: true,
                    lastLoginAt: new Date(),
                },
            })
        } else {
            // Update existing user
            await db.user.update({
                where: { id: user.id },
                data: {
                    isVerified: true,
                    lastLoginAt: new Date(),
                    loginCount: { increment: 1 },
                },
            })
        }

        // Generate JWT token
        const token = generateToken({
            userId: user.id,
            role: user.role,
            phone: user.phone,
        })

        // Create session in Redis
        await createSession(user.id, token)

        return NextResponse.json({
            success: true,
            message: 'Login successful',
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
    } catch (error) {
        console.error('Verify OTP Error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to verify OTP' },
            { status: 500 }
        )
    }
}