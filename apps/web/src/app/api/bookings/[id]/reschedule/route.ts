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
        const { newDate, newTime, reason } = body

        if (!newDate || !newTime) {
            return NextResponse.json({ success: false, error: 'New date and time are required' }, { status: 400 })
        }

        const booking = await db.booking.findUnique({ where: { id } })
        if (!booking) return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 })

        // Only allow reschedule if booking is not completed or cancelled
        if (['SERVICE_COMPLETED', 'CANCELLED'].includes(booking.status)) {
            return NextResponse.json({ success: false, error: 'Cannot reschedule this booking' }, { status: 400 })
        }

        // Verify ownership (customer or admin)
        if (booking.userId !== payload.userId && payload.role !== 'ADMIN' && payload.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ success: false, error: 'Not authorized' }, { status: 403 })
        }

        const updatedBooking = await db.booking.update({
            where: { id },
            data: {
                scheduledDate: new Date(newDate),
                scheduledTime: newTime,
            }
        })

        await db.bookingStatusHistory.create({
            data: {
                bookingId: id,
                status: booking.status,
                note: `Rescheduled to ${newDate} ${newTime}. Reason: ${reason || 'Not provided'}`,
                changedBy: payload.userId
            }
        })

        return NextResponse.json({ success: true, data: updatedBooking })
    } catch (error) {
        console.error('Reschedule Error:', error)
        return NextResponse.json({ success: false, error: 'Failed to reschedule' }, { status: 500 })
    }
}