import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken, updateSessionActivity } from '@/lib/auth'

export async function GET(request: Request) {
    try {
        const authHeader = request.headers.get('authorization')

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const token = authHeader.substring(7)
        const payload = verifyToken(token)

        if (!payload) {
            return NextResponse.json(
                { success: false, error: 'Invalid token' },
                { status: 401 }
            )
        }

        // Fetch user from database
        const user = await db.user.findUnique({
            where: { id: payload.userId },
            select: {
                id: true,
                phone: true,
                name: true,
                email: true,
                avatar: true,
                role: true,
                isVerified: true,
                isActive: true,
                walletBalance: true,
                loyaltyPoints: true,
                loyaltyTier: true,
                createdAt: true,
            },
        })

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'User not found' },
                { status: 404 }
            )
        }

        // Update session activity
        await updateSessionActivity(user.id)

        return NextResponse.json({
            success: true,
            data: user,
        })
    } catch (error) {
        console.error('Get User Error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch user' },
            { status: 500 }
        )
    }
}