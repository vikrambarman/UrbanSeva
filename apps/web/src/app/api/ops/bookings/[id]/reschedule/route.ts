/**
 * WHAT: Reschedule booking with OTP confirmation
 * WHY: 
 * - Create RescheduleRequest with OTP
 * - Send OTP to customer via SMS
 * - Booking status changes to RESCHEDULE_PENDING
 * - Customer must confirm with OTP
 * NOTE: Direct reschedule without OTP is NOT allowed
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCallingTeamUser } from '@/lib/auth'
import { generateAndSendRescheduleOTP } from '@/lib/notifications'

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCallingTeamUser(request)
        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const { id: bookingId } = await params
        const body = await request.json()
        const { newDate, newTime, notes } = body

        if (!newDate || !newTime) {
            return NextResponse.json(
                { success: false, error: 'New date and time are required' },
                { status: 400 }
            )
        }

        // Verify booking exists
        const booking = await db.booking.findUnique({
            where: { id: bookingId },
            include: {
                user: { select: { name: true, phone: true } },
            }
        })

        if (!booking) {
            return NextResponse.json(
                { success: false, error: 'Booking not found' },
                { status: 404 }
            )
        }

        // Cannot reschedule completed or cancelled bookings
        if (['SERVICE_COMPLETED', 'CANCELLED', 'REFUNDED', 'CANCELLED_BY_CUSTOMER', 'CANCELLED_BY_OPS', 'CANCELLED_BY_PROVIDER'].includes(booking.status)) {
            return NextResponse.json(
                { success: false, error: 'Cannot reschedule completed/cancelled booking' },
                { status: 400 }
            )
        }

        // ═══════════════════════════════════════════════════════════════
        // NEW: Generate OTP and send to customer
        // ═══════════════════════════════════════════════════════════════
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

        const otp = Math.floor(1000 + Math.random() * 9000).toString() // 4-digit OTP

        // Create reschedule request
        const rescheduleRequest = await db.rescheduleRequest.create({
            data: {
                bookingId,
                originalSlot: booking.scheduledDate,
                proposedSlot: new Date(`${newDate}T${newTime}:00`),
                reason: notes || 'Rescheduled by OPS team',
                otp,
                otpExpiresAt: otpExpiry,
                status: 'PENDING',
                requestedBy: 'OPS',
            },
        })

        // Update booking status to RESCHEDULE_PENDING
        await db.booking.update({
            where: { id: bookingId },
            data: { status: 'RESCHEDULE_PENDING' },
        })

        // Send OTP to customer
        try {
            const newDateTime = `${new Date(newDate).toLocaleDateString('en-IN')} at ${newTime}`
            await generateAndSendRescheduleOTP(
                booking.userId,
                booking.user.phone,
                booking.bookingNumber,
                newDateTime.split(' at ')[0],
                newDateTime.split(' at ')[1],
            )
        } catch (notifError) {
            console.error('Notification error:', notifError)
        }

        // Create activity log
        await db.bookingAssignmentLog.create({
            data: {
                bookingId,
                actionBy: user.userId,
                action: 'RESCHEDULE_REQUESTED',
                fromValue: `${booking.scheduledDate.toISOString().split('T')[0]} ${booking.scheduledTime}`,
                toValue: `${newDate} ${newTime}`,
                notes: `OTP sent to customer. Request ID: ${rescheduleRequest.id}`,
            }
        })

        // Create status history
        await db.bookingStatusHistory.create({
            data: {
                bookingId,
                status: 'RESCHEDULE_PENDING',
                note: `Reschedule requested. OTP sent to customer. New slot: ${newDate} ${newTime}`,
                changedBy: user.userId,
            }
        })

        return NextResponse.json({
            success: true,
            message: `Reschedule request sent. OTP sent to customer.`,
            data: {
                rescheduleRequestId: rescheduleRequest.id,
                otpSent: true,
            },
        })

    } catch (error) {
        console.error('❌ Ops reschedule error:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}