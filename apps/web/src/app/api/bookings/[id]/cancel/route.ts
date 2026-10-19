import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { cancelBookingWithRefund } from '@/lib/booking-helpers'

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authHeader = request.headers.get('authorization')
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        const token = authHeader.substring(7)
        const payload = verifyToken(token)
        if (!payload) {
            return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 })
        }

        const { id } = await params
        const body = await request.json()
        const { reason, cancelledBy } = body // 'CUSTOMER' | 'OPS' | 'PROVIDER'

        const result = await cancelBookingWithRefund(id, cancelledBy, reason, payload.userId)

        if (!result.success) {
            return NextResponse.json({ success: false, error: result.error }, { status: 400 })
        }

        return NextResponse.json({
            success: true,
            message: 'Booking cancelled successfully',
            data: result.data
        })
    } catch (error) {
        console.error('Cancel Booking Error:', error)
        return NextResponse.json({ success: false, error: 'Failed to cancel booking' }, { status: 500 })
    }
}