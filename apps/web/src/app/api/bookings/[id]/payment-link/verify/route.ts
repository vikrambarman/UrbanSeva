// apps/web/src/app/api/bookings/[id]/payment-link/verify/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getProviderUser } from '@/lib/auth'

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const providerAuth = await getProviderUser(request)
        if (!providerAuth) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

        const { id } = await params
        const body = await request.json()
        const { razorpayPaymentId } = body

        const booking = await db.booking.findUnique({ where: { id } })
        if (!booking) return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 })

        if (!booking.razorpayPaymentLinkId) {
            return NextResponse.json({ success: false, error: 'No payment link found for this booking' }, { status: 400 })
        }

        // Update payment status to PAID
        await db.payment.updateMany({
            where: { bookingId: id },
            data: {
                status: 'PAID',
                razorpayPaymentId: razorpayPaymentId || 'manual_pod_confirmation',
                // ✅ FIX: removed updatedAt, Prisma handles it automatically via @updatedAt
            }
        })

        await db.booking.update({
            where: { id },
            data: { paymentStatus: 'PAID' }
        })

        return NextResponse.json({ success: true, message: 'Payment confirmed successfully' })
    } catch (error) {
        console.error('Payment Link Verify Error:', error)
        return NextResponse.json({ success: false, error: 'Failed to verify payment' }, { status: 500 })
    }
}