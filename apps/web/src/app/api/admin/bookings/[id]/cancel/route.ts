import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminUser } from '@/lib/auth'

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const admin = await getAdminUser(request)
        if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

        const { id } = await params
        const body = await request.json()

        const booking = await db.booking.update({
            where: { id },
            data: {
                status: 'CANCELLED',
                cancelledAt: new Date(),
                cancelReason: body.reason || 'Cancelled by Admin',
            }
        })

        // Handle refund if payment was made
        if (booking.paymentStatus === 'PAID' && booking.totalAmount > 0) {
            await db.booking.update({
                where: { id },
                data: { paymentStatus: 'REFUND_INITIATED' }
            })
            // TODO: Trigger actual Razorpay refund API here in production
        }

        await db.bookingStatusHistory.create({
            data: {
                bookingId: id,
                status: 'CANCELLED',
                note: body.reason || 'Cancelled by Admin',
                changedBy: admin.userId
            }
        })

        return NextResponse.json({ success: true, data: booking })
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed to cancel booking' }, { status: 500 })
    }
}