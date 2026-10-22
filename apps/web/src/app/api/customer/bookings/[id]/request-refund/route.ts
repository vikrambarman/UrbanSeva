/**
 * ═══════════════════════════════════════════════════════════════
 * CUSTOMER REFUND REQUEST API
 * ═══════════════════════════════════════════════════════════════
 * KYA: Customer booking ke liye refund request submit karta hai
 * KYUN: Customer ko refund option milna chahiye agar service satisfactory nahi thi
 * FLOW: Auth check → Booking validate → Status check → REFUND_INITIATED set karo
 * ═══════════════════════════════════════════════════════════════
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // 1. Authentication
        const authHeader = request.headers.get('authorization')
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        const token = authHeader.substring(7)
        const payload = verifyToken(token)
        if (!payload) {
            return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 })
        }

        const { id } = params
        const body = await request.json()
        const { reason } = body

        // 2. Validate reason
        if (!reason || reason.trim().length < 10) {
            return NextResponse.json(
                { success: false, error: 'Please provide a detailed reason (minimum 10 characters)' },
                { status: 400 }
            )
        }

        // 3. Fetch booking with validation
        const booking = await db.booking.findUnique({
            where: { id },
            include: {
                user: { select: { id: true, phone: true } }
            }
        })

        if (!booking) {
            return NextResponse.json(
                { success: false, error: 'Booking not found' },
                { status: 404 }
            )
        }

        // 4. Verify ownership
        if (booking.userId !== payload.userId) {
            return NextResponse.json(
                { success: false, error: 'You can only request refund for your own bookings' },
                { status: 403 }
            )
        }

        // 5. Check if refund is allowed
        const allowedStatuses = ['SERVICE_COMPLETED', 'NO_SHOW']
        if (!allowedStatuses.includes(booking.status)) {
            return NextResponse.json(
                { success: false, error: `Refund can only be requested after service completion. Current status: ${booking.status}` },
                { status: 400 }
            )
        }

        // Check if already refunded or refund initiated
        if (booking.paymentStatus === 'REFUNDED') {
            return NextResponse.json(
                { success: false, error: 'This booking has already been refunded' },
                { status: 400 }
            )
        }

        if (booking.paymentStatus === 'REFUND_INITIATED') {
            return NextResponse.json(
                { success: false, error: 'Refund request already pending for this booking' },
                { status: 400 }
            )
        }

        // Check payment was actually made
        if (booking.paymentStatus !== 'PAID') {
            return NextResponse.json(
                { success: false, error: 'Refund can only be requested for paid bookings' },
                { status: 400 }
            )
        }

        // 6. Update booking status to REFUND_INITIATED
        await db.booking.update({
            where: { id },
            data: {
                paymentStatus: 'REFUND_INITIATED',
                // Store refund reason in specialInstructions (ya agar separate field ho toh wo use karo)
                specialInstructions: booking.specialInstructions 
                    ? `${booking.specialInstructions}\n\n[REFUND REQUEST]: ${reason}`
                    : `[REFUND REQUEST]: ${reason}`
            }
        })

        // 7. TODO: Send notification to admin/OPS (SMS/Email)
        console.log(`🔔 Refund request for booking #${booking.bookingNumber} by ${booking.user.phone}`)
        console.log(`Reason: ${reason}`)

        return NextResponse.json({
            success: true,
            message: 'Refund request submitted successfully. Our team will review it within 24-48 hours.',
            data: {
                bookingId: id,
                bookingNumber: booking.bookingNumber,
                refundAmount: booking.totalAmount,
                status: 'REFUND_INITIATED'
            }
        })

    } catch (error) {
        console.error('Refund Request Error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to submit refund request' },
            { status: 500 }
        )
    }
}