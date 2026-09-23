import { NextResponse } from 'next/server'
import { deleteSession } from '@/lib/auth'
import { verifyToken } from '@/lib/auth'

export async function POST(request: Request) {
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

        // Delete session from Redis
        await deleteSession(payload.userId)

        return NextResponse.json({
            success: true,
            message: 'Logged out successfully',
        })
    } catch (error) {
        console.error('Logout Error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to logout' },
            { status: 500 }
        )
    }
}