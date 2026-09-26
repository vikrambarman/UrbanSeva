import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

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
        if (!payload) return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 })

        const { id } = await params
        const body = await request.json()
        const { reason, amount } = body

        const booking = await db.booking.findUnique({
            where: { id },
            include: { payment: true }
        })

        if (!booking) return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 })

        if (booking.paymentStatus !== 'PAID') {
            return NextResponse.json({ success: false, error: 'Booking is not paid, cannot refund' }, { status: 400 })
        }

        const refundAmount = amount || booking.totalAmount

        // Update booking
        await db.booking.update({
            where: { id },
            data: {
                paymentStatus: 'REFUND_INITIATED',
                cancelReason: reason || 'Refund requested',
            }
        })

        // Update payment record
        if (booking.payment) {
            await db.payment.update({
                where: { id: booking.payment.id },
                data: {
                    status: 'REFUNDED',
                    refundAmount,
                    refundedAt: new Date()
                }
            })
        }

        // Credit wallet
        await db.user.update({
            where: { id: booking.userId },
            data: { walletBalance: { increment: refundAmount } }
        })

        await db.walletTransaction.create({
            data: {
                userId: booking.userId,
                type: 'REFUND',
                amount: refundAmount,
                balance: 0, // Will be updated by trigger or manually
                description: `Refund for booking #${booking.bookingNumber}`,
                referenceId: booking.id
            }
        })

        await db.bookingStatusHistory.create({
            data: {
                bookingId: id,
                status: 'REFUND_INITIATED',
                note: `Refund of ₹${refundAmount} initiated. Reason: ${reason || 'Not provided'}`,
                changedBy: payload.userId
            }
        })

        return NextResponse.json({ success: true, message: 'Refund processed successfully' })
    } catch (error) {
        console.error('Refund Error:', error)
        return NextResponse.json({ success: false, error: 'Failed to process refund' }, { status: 500 })
    }
}