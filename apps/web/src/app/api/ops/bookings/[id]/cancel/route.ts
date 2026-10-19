// api/ops/bookings/[id]/cancel/route.ts
// KYA: Calling team booking cancel kare with reason + automatic refund
// KYUN: Customer call pe cancel bol sakta hai — staff reason ke saath cancel kare
// UPDATE: Razorpay refund automatically process hoga (100% for OPS cancel)

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCallingTeamUser } from '@/lib/auth'
import { processRefund } from '@/lib/razorpay'
import { sendNotification, sendSMS } from '@/lib/notifications'

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

        // Verify booking exists with all relations
        const booking = await db.booking.findUnique({
            where: { id: bookingId },
            include: {
                payment: true,
                user: { select: { id: true, name: true, phone: true } },
                service: { select: { name: true } },
                provider: {
                    include: { user: { select: { name: true, phone: true } } }
                }
            }
        })

        if (!booking) {
            return NextResponse.json(
                { success: false, error: 'Booking not found' },
                { status: 404 }
            )
        }

        // Cannot cancel already cancelled
        const cancelledStatuses = ['CANCELLED', 'CANCELLED_BY_CUSTOMER', 'CANCELLED_BY_OPS', 'CANCELLED_BY_PROVIDER']
        if (cancelledStatuses.includes(booking.status)) {
            return NextResponse.json(
                { success: false, error: 'Booking is already cancelled' },
                { status: 400 }
            )
        }

        // ═══════════════════════════════════════════════════════════════
        // OPS CANCELLATION = 100% REFUND ALWAYS
        // ═══════════════════════════════════════════════════════════════
        const refundPercentage = 100
        const refundAmount = booking.totalAmount

        // ═══════════════════════════════════════════════════════════════
        // PROCESS RAZORPAY REFUND (if online payment was made)
        // ═══════════════════════════════════════════════════════════════
        let refundId: string | null = null
        let refundSuccess = false

        if (booking.payment && booking.payment.status === 'PAID' && booking.payment.razorpayPaymentId && refundAmount > 0) {
            try {
                const refundResult = await processRefund(
                    booking.payment.razorpayPaymentId,
                    refundAmount,
                    'optimum'
                )

                if (refundResult.success) {
                    refundId = refundResult.refundId
                    refundSuccess = true
                } else {
                    console.error('Razorpay refund failed:', refundResult.error)
                    // Continue with cancellation even if refund fails (manual refund later)
                }
            } catch (refundError) {
                console.error('Refund processing error:', refundError)
            }
        }

        // ═══════════════════════════════════════════════════════════════
        // DETERMINE NEW STATUS
        // ═══════════════════════════════════════════════════════════════
        const newStatus = 'CANCELLED_BY_OPS'

        // Build update data
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const updateData: any = {
            status: newStatus,
            cancelledAt: new Date(),
            cancelReason: reason,
        }

        // Update payment status based on refund
        if (booking.payment && booking.payment.status === 'PAID') {
            if (refundAmount > 0) {
                updateData.paymentStatus = refundSuccess ? 'REFUNDED' : 'REFUND_INITIATED'
            }
        }

        // ═══════════════════════════════════════════════════════════════
        // UPDATE BOOKING + CREATE LOGS (Transaction)
        // ═══════════════════════════════════════════════════════════════
        const refundNote = refundAmount > 0
            ? `Refund: Rs.${refundAmount} (${refundPercentage}%). ${refundSuccess ? `Refund ID: ${refundId}` : 'Refund pending - manual processing required.'}`
            : 'No refund applicable.'

        const [updatedBooking] = await db.$transaction([
            db.booking.update({
                where: { id: bookingId },
                data: updateData,
                include: {
                    user: { select: { id: true, name: true, phone: true } },
                    service: { select: { name: true } },
                }
            }),

            db.bookingAssignmentLog.create({
                data: {
                    bookingId,
                    actionBy: user.userId,
                    action: 'CANCELLED',
                    fromValue: booking.status,
                    toValue: newStatus,
                    notes: `${reason}${notes ? ` | ${notes}` : ''} | ${refundNote}`,
                }
            }),

            db.bookingStatusHistory.create({
                data: {
                    bookingId,
                    status: newStatus,
                    note: `Cancelled by OPS: ${reason}${notes ? ` (${notes})` : ''} | ${refundNote}`,
                    changedBy: user.userId,
                }
            }),

            // Update payment record with refund details
            ...(booking.payment && booking.payment.status === 'PAID' && refundAmount > 0 ? [
                db.payment.update({
                    where: { bookingId },
                    data: {
                        status: refundSuccess ? 'REFUNDED' as const : 'REFUND_INITIATED' as const,
                        refundAmount,
                        ...(refundId ? { refundId, refundedAt: new Date() } : {}),
                    }
                })
            ] : []),
        ])

        // ═══════════════════════════════════════════════════════════════
        // SEND NOTIFICATIONS
        // ═══════════════════════════════════════════════════════════════
        try {
            // In-app notification to customer
            await sendNotification({
                userId: booking.userId,
                title: 'Booking Cancelled',
                body: `Your booking #${booking.bookingNumber} has been cancelled. ${refundAmount > 0 ? `Refund of Rs.${refundAmount} will be processed within 5-7 days.` : ''} Reason: ${reason}`,
                type: 'GENERAL',
                referenceId: booking.id,
            })

            // SMS to customer
            if (booking.user.phone) {
                const smsMessage = refundAmount > 0
                    ? `Booking #${booking.bookingNumber} cancelled. Refund of Rs.${refundAmount} will be processed within 5-7 days. Reason: ${reason}. - HomeServices`
                    : `Booking #${booking.bookingNumber} cancelled. Reason: ${reason}. - HomeServices`

                await sendSMS({
                    phone: booking.user.phone,
                    message: smsMessage,
                    type: 'GENERAL',
                })
            }

            // SMS to provider if assigned
            if (booking.provider?.user.phone) {
                await sendSMS({
                    phone: booking.provider.user.phone,
                    message: `Booking #${booking.bookingNumber} has been cancelled by our team. - HomeServices`,
                    type: 'GENERAL',
                })
            }
        } catch (notifError) {
            console.error('Notification error:', notifError)
            // Don't fail the request if notification fails
        }

        return NextResponse.json({
            success: true,
            message: 'Booking cancelled successfully',
            data: {
                ...updatedBooking,
                refundAmount,
                refundPercentage,
                refundId,
                refundSuccess,
            },
        })

    } catch (error) {
        console.error('Ops cancel error:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}