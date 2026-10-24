import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCallingTeamUser } from '@/lib/auth'

// GET: Fetch all pending refund requests
export async function GET(request: NextRequest) {
    try {
        const user = await getCallingTeamUser(request)
        if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

        const refunds = await db.booking.findMany({
            where: { paymentStatus: 'REFUND_INITIATED' },
            include: {
                user: { select: { name: true, phone: true, email: true } },
                service: { select: { name: true } }
            },
            orderBy: { updatedAt: 'desc' }
        })

        return NextResponse.json({ success: true, data: refunds })
    } catch (error) {
        console.error('Fetch Refunds Error:', error)
        return NextResponse.json({ success: false, error: 'Failed to fetch refunds' }, { status: 500 })
    }
}

// POST: Process refund (approve/reject)
export async function POST(request: NextRequest) {
    try {
        const user = await getCallingTeamUser(request)
        if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

        const body = await request.json()
        const { bookingId, action, notes } = body

        if (!bookingId || !action || !['APPROVE', 'REJECT'].includes(action)) {
            return NextResponse.json({ success: false, error: 'Invalid booking ID or action' }, { status: 400 })
        }

        const booking = await db.booking.findUnique({
            where: { id: bookingId },
            include: { user: { select: { id: true, name: true, phone: true } } }
        })

        if (!booking) return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 })
        if (booking.paymentStatus !== 'REFUND_INITIATED') {
            return NextResponse.json({ success: false, error: 'This booking does not have a pending refund request' }, { status: 400 })
        }

        if (action === 'APPROVE') {
            const refundAmount = booking.totalAmount
            await db.$transaction(async (tx) => {
                await tx.user.update({
                    where: { id: booking.userId },
                    data: { walletBalance: { increment: refundAmount } }
                })
                await tx.booking.update({
                    where: { id: bookingId },
                    data: {
                        paymentStatus: 'REFUNDED',
                        specialInstructions: `${booking.specialInstructions || ''}\n\n[REFUND APPROVED by ${user.userId}]: ${notes || 'No notes'}\nAmount: ₹${refundAmount} credited to wallet`
                    }
                })
            })
            return NextResponse.json({ success: true, message: `Refund of ₹${refundAmount} credited to customer wallet` })
        } else {
            await db.booking.update({
                where: { id: bookingId },
                data: {
                    paymentStatus: 'PAID',
                    specialInstructions: `${booking.specialInstructions || ''}\n\n[REFUND REJECTED by ${user.userId}]: ${notes || 'No reason'}`
                }
            })
            return NextResponse.json({ success: true, message: 'Refund request rejected' })
        }
    } catch (error) {
        console.error('Process Refund Error:', error)
        return NextResponse.json({ success: false, error: 'Failed to process refund' }, { status: 500 })
    }
}