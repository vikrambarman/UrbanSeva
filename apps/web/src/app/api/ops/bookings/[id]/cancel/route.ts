// api/ops/bookings/[id]/cancel/route.ts
// KYA: Calling team booking cancel kare with reason
// KYUN: Customer call pe cancel bol sakta hai — staff reason ke saath cancel kare

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
        const { reason, notes } = body

        if (!reason) {
            return NextResponse.json(
                { success: false, error: 'Cancellation reason is required' },
                { status: 400 }
            )
        }

        // Verify booking exists
        const booking = await db.booking.findUnique({
            where: { id: bookingId },
            include: { payment: true }
        })

        if (!booking) {
            return NextResponse.json(
                { success: false, error: 'Booking not found' },
                { status: 404 }
            )
        }

        // Cannot cancel already cancelled
        if (['CANCELLED', 'REFUNDED'].includes(booking.status)) {
            return NextResponse.json(
                { success: false, error: 'Booking is already cancelled' },
                { status: 400 }
            )
        }

        // Build update data
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const updateData: any = {
            status: 'CANCELLED' as const,
            cancelledAt: new Date(),
            cancelReason: reason,
        }

        // If payment was made, initiate refund
        if (booking.payment && booking.payment.status === 'PAID') {
            updateData.paymentStatus = 'REFUND_INITIATED'
        }

        // Update booking + create logs
        const [updatedBooking] = await db.$transaction([
            db.booking.update({
                where: { id: bookingId },
                data: updateData,
                include: {
                    user: { select: { name: true, phone: true } },
                    service: { select: { name: true } },
                }
            }),

            db.bookingAssignmentLog.create({
                data: {
                    bookingId,
                    actionBy: user.userId,
                    action: 'CANCELLED',
                    fromValue: booking.status,
                    toValue: 'CANCELLED',
                    notes: `${reason}${notes ? ` | ${notes}` : ''}`,
                }
            }),

            db.bookingStatusHistory.create({
                data: {
                    bookingId,
                    status: 'CANCELLED',
                    note: `Cancelled by ops: ${reason}${notes ? ` (${notes})` : ''}`,
                    changedBy: user.userId,
                }
            }),

            // If payment was made, update payment status
            ...(booking.payment && booking.payment.status === 'PAID' ? [
                db.payment.update({
                    where: { bookingId },
                    data: { status: 'REFUND_INITIATED' as const }
                })
            ] : []),
        ])

        return NextResponse.json({
            success: true,
            message: 'Booking cancelled successfully',
            data: updatedBooking,
        })

    } catch (error) {
        console.error('❌ Ops cancel error:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}