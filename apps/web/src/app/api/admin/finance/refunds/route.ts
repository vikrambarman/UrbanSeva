import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
    try {
        const admin = await getAdminUser(request)
        if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

        const refunds = await db.booking.findMany({
            where: { paymentStatus: { in: ['REFUND_INITIATED', 'REFUNDED'] } },
            orderBy: { updatedAt: 'desc' },
            include: {
                user: { select: { name: true, phone: true } },
                service: { select: { name: true } }
            }
        })

        return NextResponse.json({ success: true, data: refunds })
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed to fetch refunds' }, { status: 500 })
    }
}

// Process Refund (Mark as fully refunded)
export async function POST(request: NextRequest) {
    try {
        const admin = await getAdminUser(request)
        if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

        const body = await request.json()
        const { bookingId } = body

        if (!bookingId) return NextResponse.json({ success: false, error: 'Booking ID required' }, { status: 400 })

        const booking = await db.booking.findUnique({ where: { id: bookingId }, include: { payment: true } })
        if (!booking) return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 })

        // Update Booking status
        await db.booking.update({
            where: { id: bookingId },
            data: { paymentStatus: 'REFUNDED' }
        })

        // Update Payment record if exists
        if (booking.payment) {
            await db.payment.update({
                where: { id: booking.payment.id },
                data: { 
                    status: 'REFUNDED', 
                    refundAmount: booking.totalAmount,
                    refundedAt: new Date()
                }
            })
        }

        // TODO: In production, trigger actual Razorpay refund API here

        return NextResponse.json({ success: true, message: 'Refund processed successfully' })
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed to process refund' }, { status: 500 })
    }
}