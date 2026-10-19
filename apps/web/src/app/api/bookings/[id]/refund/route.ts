/**
 * WHAT: Manual refund API (for cases where auto-refund failed)
 * WHY: OPS team manually refund kar sake agar auto-refund fail ho gaya
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { processRefund } from '@/lib/razorpay'

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
        const { amount, reason } = body

        const booking = await db.booking.findUnique({
            where: { id },
            include: { payment: true, user: { select: { phone: true } } }
        })

        if (!booking) {
            return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 })
        }

        if (booking.paymentStatus === 'REFUNDED') {
            return NextResponse.json({ success: false, error: 'Booking already refunded' }, { status: 400 })
        }

        if (!booking.payment?.razorpayPaymentId) {
            return NextResponse.json({ success: false, error: 'No payment found for this booking' }, { status: 400 })
        }

        const refundAmount = amount || booking.totalAmount

        // Process Razorpay refund
        const refundResult = await processRefund(
            booking.payment.razorpayPaymentId,
            refundAmount,
            'optimum'
        )

        if (!refundResult.success) {
            return NextResponse.json({
                success: false,
                error: 'Refund failed',
                details: refundResult.error
            }, { status: 500 })
        }

        // Update booking
        await db.booking.update({
            where: { id },
            data: {
                paymentStatus: 'REFUNDED',
                cancelReason: reason || booking.cancelReason || 'Refund processed',
            }
        })

        // Update payment record
        await db.payment.update({
            where: { id: booking.payment.id },
            data: {
                status: 'REFUNDED',
                refundAmount,
                refundId: refundResult.refundId,
                refundedAt: new Date(),
            }
        })

        // Credit wallet (optional - can be disabled)
        // await db.user.update({
        //     where: { id: booking.userId },
        //     data: { walletBalance: { increment: refundAmount } }
        // })

        // Create status history
        await db.bookingStatusHistory.create({
            data: {
                bookingId: id,
                status: 'REFUNDED',
                note: `Refund of ₹${refundAmount} processed. Refund ID: ${refundResult.refundId}. Reason: ${reason || 'Not provided'}`,
                changedBy: payload.userId
            }
        })

        return NextResponse.json({
            success: true,
            message: 'Refund processed successfully',
            data: {
                refundId: refundResult.refundId,
                refundAmount,
            }
        })
    } catch (error) {
        console.error('Refund Error:', error)
        return NextResponse.json({ success: false, error: 'Failed to process refund' }, { status: 500 })
    }
}