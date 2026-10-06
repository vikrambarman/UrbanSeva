/**
 * WHAT: Verify reschedule OTP and complete reschedule
 * WHY: 
 * - Customer OTP enter karega
 * - If valid → Booking reschedule hogi
 * - If invalid/expired → Request rejected
 * NOTE: Max 3 attempts allowed
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { sendBookingConfirmed } from '@/lib/notifications'

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authHeader = request.headers.get('authorization')
        if (!authHeader?.startsWith('Bearer ')) {
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

        const { id: bookingId } = await params
        const body = await request.json()
        const { otp } = body

        if (!otp) {
            return NextResponse.json(
                { success: false, error: 'OTP is required' },
                { status: 400 }
            )
        }

        // Find pending reschedule request
        const rescheduleRequest = await db.rescheduleRequest.findFirst({
            where: {
                bookingId,
                status: 'PENDING',
            },
            include: {
                booking: {
                    include: {
                        user: { select: { name: true, phone: true } },
                        provider: { include: { user: { select: { name: true, phone: true } } } },
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
        })

        if (!rescheduleRequest) {
            return NextResponse.json(
                { success: false, error: 'No pending reschedule request found' },
                { status: 404 }
            )
        }

        // Check OTP expiry
        if (new Date() > rescheduleRequest.otpExpiresAt) {
            await db.rescheduleRequest.update({
                where: { id: rescheduleRequest.id },
                data: { status: 'REJECTED' },
            })

            return NextResponse.json(
                { success: false, error: 'OTP expired. Please request new reschedule.' },
                { status: 400 }
            )
        }

        // Check OTP attempts
        if (rescheduleRequest.otpAttempts >= 3) {
            await db.rescheduleRequest.update({
                where: { id: rescheduleRequest.id },
                data: { status: 'REJECTED' },
            })

            return NextResponse.json(
                { success: false, error: 'Max attempts exceeded. Please request new reschedule.' },
                { status: 400 }
            )
        }

        // Verify OTP
        if (rescheduleRequest.otp !== otp) {
            // Increment attempts
            await db.rescheduleRequest.update({
                where: { id: rescheduleRequest.id },
                data: { otpAttempts: { increment: 1 } },
            })

            return NextResponse.json(
                { success: false, error: 'Invalid OTP' },
                { status: 400 }
            )
        }

        // ═══════════════════════════════════════════════════════════════
        // OTP Valid - Complete reschedule
        // ═══════════════════════════════════════════════════════════════
        const newDate = rescheduleRequest.proposedSlot.toISOString().split('T')[0]
        const newTime = rescheduleRequest.proposedSlot.toTimeString().split(' ')[0].substring(0, 5)

        // Update booking
        await db.booking.update({
            where: { id: bookingId },
            data: {
                scheduledDate: rescheduleRequest.proposedSlot,
                scheduledTime: newTime,
                status: 'CONFIRMED', // Back to confirmed
            },
        })

        // Update reschedule request
        await db.rescheduleRequest.update({
            where: { id: rescheduleRequest.id },
            data: {
                status: 'CONFIRMED',
                confirmedAt: new Date(),
            },
        })

        // Create status history
        await db.bookingStatusHistory.create({
            data: {
                bookingId,
                status: 'CONFIRMED',
                note: `Booking rescheduled to ${newDate} ${newTime} (OTP verified)`,
                changedBy: payload.userId,
            }
        })

        // Send confirmation notification
        try {
            const providerName = rescheduleRequest.booking.provider?.user?.name || 'TBD'
            await sendBookingConfirmed(
                rescheduleRequest.booking.userId,
                rescheduleRequest.booking.user.phone,
                rescheduleRequest.booking.bookingNumber,
                providerName,
                newDate,
                newTime
            )
        } catch (notifError) {
            console.error('Notification error:', notifError)
        }

        return NextResponse.json({
            success: true,
            message: 'Booking rescheduled successfully',
            data: {
                newDate,
                newTime,
            },
        })

    } catch (error) {
        console.error('❌ Verify reschedule OTP error:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}