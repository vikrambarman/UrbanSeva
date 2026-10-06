// api/ops/bookings/[id]/reschedule/route.ts
// KYA: Calling team booking reschedule kare (customer call ke baad)
// KYUN: Customer call pe naya date/time maang sakta hai — staff directly update kare

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCallingTeamUser } from '@/lib/auth'

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
            where: { id: bookingId }
        })

        if (!booking) {
            return NextResponse.json(
                { success: false, error: 'Booking not found' },
                { status: 404 }
            )
        }

        // Cannot reschedule completed or cancelled bookings
        if (['SERVICE_COMPLETED', 'CANCELLED', 'REFUNDED'].includes(booking.status)) {
            return NextResponse.json(
                { success: false, error: 'Cannot reschedule completed/cancelled booking' },
                { status: 400 }
            )
        }

        const oldDateTime = `${booking.scheduledDate.toISOString().split('T')[0]} ${booking.scheduledTime}`
        const newDateTime = `${newDate} ${newTime}`

        // Update booking + create logs
        const [updatedBooking] = await db.$transaction([
            db.booking.update({
                where: { id: bookingId },
                data: {
                    scheduledDate: new Date(newDate),
                    scheduledTime: newTime,
                },
                include: {
                    user: { select: { name: true, phone: true } },
                    provider: { include: { user: { select: { name: true, phone: true } } } },
                    service: { select: { name: true } },
                }
            }),

            db.bookingAssignmentLog.create({
                data: {
                    bookingId,
                    actionBy: user.userId,
                    action: 'RESCHEDULED',
                    fromValue: oldDateTime,
                    toValue: newDateTime,
                    notes: notes || null,
                }
            }),

            db.bookingStatusHistory.create({
                data: {
                    bookingId,
                    status: booking.status, // Status same rahega
                    note: `Rescheduled from ${oldDateTime} to ${newDateTime}${notes ? ` (${notes})` : ''}`,
                    changedBy: user.userId,
                }
            }),
        ])

        return NextResponse.json({
            success: true,
            message: `Booking rescheduled to ${newDateTime}`,
            data: updatedBooking,
        })

    } catch (error) {
        console.error('❌ Ops reschedule error:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}