/**
 * WHAT: OPS booking confirm karega (Slot verification ke baad)
 * WHY: 2-step flow maintain karne ke liye (Confirm -> Assign)
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCallingTeamUser } from '@/lib/auth'
import { sendBookingConfirmed } from '@/lib/notifications'

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCallingTeamUser(request)
        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        const { id: bookingId } = await params

        const booking = await db.booking.findUnique({
            where: { id: bookingId },
            include: {
                user: { select: { id: true, name: true, phone: true } },
                service: { select: { name: true } }
            }
        })

        if (!booking) {
            return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 })
        }

        // Sirf initial states mein hi confirm kar sakte hain
        const validStatuses = ['PENDING', 'PAYMENT_RECEIVED', 'PENDING_CONFIRMATION']
        if (!validStatuses.includes(booking.status)) {
            return NextResponse.json({ success: false, error: 'Booking cannot be confirmed in current status' }, { status: 400 })
        }

        // Update booking status to CONFIRMED
        await db.booking.update({
            where: { id: bookingId },
            data: { status: 'CONFIRMED' }
        })

        // Create logs in transaction
        await db.$transaction([
            db.bookingStatusHistory.create({
                data: {
                    bookingId,
                    status: 'CONFIRMED',
                    note: 'Booking slot verified and confirmed by OPS team.',
                    changedBy: user.userId,
                }
            }),
            db.bookingAssignmentLog.create({
                data: {
                    bookingId,
                    actionBy: user.userId,
                    action: 'CONFIRMED',
                    fromValue: booking.status,
                    toValue: 'CONFIRMED',
                    notes: 'Slot verified by OPS.',
                }
            })
        ])

        // Send notification to customer
        try {
            await sendBookingConfirmed(
                booking.userId,
                booking.user.phone,
                booking.bookingNumber,
                'Our Professional', // Provider abhi assign nahi hua hai
                new Date(booking.scheduledDate).toLocaleDateString('en-IN'),
                booking.scheduledTime
            )
        } catch (notifError) {
            console.error('Notification error:', notifError)
        }

        return NextResponse.json({ success: true, message: 'Booking confirmed successfully' })

    } catch (error) {
        console.error('❌ Ops confirm error:', error)
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
    }
}