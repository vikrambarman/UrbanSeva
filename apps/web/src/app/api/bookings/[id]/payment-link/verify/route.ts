// apps/web/src/app/api/bookings/[id]/payment-link/verify/route.ts
/**
 * WHAT: Verify POD payment link payment
 * WHY:
 * - Provider "Confirm Payment Received" button dabayega
 * - System payment verify karega
 * - Earning status SETTLED ho jayega
 * NOTE: Razorpay webhook bhi call karega, but ye manual verification bhi hai
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getProviderUser } from '@/lib/auth'
import { sendNotification } from '@/lib/notifications'

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const providerAuth = await getProviderUser(request)
        if (!providerAuth) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        const { id: bookingId } = await params
        const body = await request.json()
        const { razorpayPaymentId } = body

        // Fetch booking
        const booking = await db.booking.findUnique({
            where: { id: bookingId },
            include: {
                user: { select: { id: true, name: true, phone: true } },
                provider: { 
                    include: { 
                        user: { select: { name: true } },
                    } 
                },
            }
        })

        if (!booking) {
            return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 })
        }

        // Verify provider owns this booking
        if (booking.provider?.userId !== providerAuth.userId) {
            return NextResponse.json({ success: false, error: 'Not authorized' }, { status: 403 })
        }

        // Check if already paid
        if (booking.paymentStatus === 'PAID') {
            return NextResponse.json({
                success: true,
                message: 'Payment already confirmed',
                data: { status: 'ALREADY_PAID' }
            })
        }

        // Verify payment with Razorpay (if payment ID provided)
        if (razorpayPaymentId && booking.razorpayPaymentLinkId) {
            const razorpayKey = process.env.RAZORPAY_KEY_ID
            const razorpaySecret = process.env.RAZORPAY_KEY_SECRET

            if (razorpayKey && razorpaySecret) {
                try {
                    const response = await fetch(
                        `https://api.razorpay.com/v1/payments/${razorpayPaymentId}`,
                        {
                            headers: {
                                'Authorization': `Basic ${Buffer.from(`${razorpayKey}:${razorpaySecret}`).toString('base64')}`
                            }
                        }
                    )
                    const paymentData = await response.json()

                    if (paymentData.status !== 'captured') {
                        return NextResponse.json({
                            success: false,
                            error: 'Payment not captured yet'
                        }, { status: 400 })
                    }
                } catch (verifyError) {
                    console.error('Razorpay verification error:', verifyError)
                }
            }
        }

        // Update booking payment status
        await db.booking.update({
            where: { id: bookingId },
            data: {
                paymentStatus: 'PAID',
                codAmountCollected: booking.totalAmount,
                codVerifiedAt: new Date(),
            }
        })

        // Update payment record
        await db.payment.updateMany({
            where: { bookingId },
            data: {
                status: 'PAID',
                paidAt: new Date(),
                razorpayPaymentId: razorpayPaymentId || booking.razorpayPaymentId,
            }
        })

        // Update earning status to SETTLED
        const earning = await db.providerEarning.findFirst({
            where: { bookingId }
        })

        if (earning && earning.status === 'PENDING_VERIFICATION') {
            await db.providerEarning.update({
                where: { id: earning.id },
                data: {
                    status: 'SETTLED',
                    settledAt: new Date(),
                }
            })
        }

        // Create status history
        await db.bookingStatusHistory.create({
            data: {
                bookingId,
                status: booking.status,
                note: `POD Payment confirmed: ₹${booking.totalAmount}`,
                changedBy: providerAuth.userId,
            }
        })

        // Notify customer
        try {
            await sendNotification({
                userId: booking.userId,
                title: 'Payment Confirmed',
                body: `Your payment of ₹${booking.totalAmount} for booking #${booking.bookingNumber} has been confirmed.`,
                type: 'PAYMENT_SUCCESS',
                referenceId: bookingId,
            })
        } catch (notifError) {
            console.error('Notification error:', notifError)
        }

        return NextResponse.json({
            success: true,
            message: 'Payment confirmed successfully',
            data: {
                status: 'PAID',
                amount: booking.totalAmount,
            }
        })

    } catch (error) {
        console.error('Payment Verification Error:', error)
        return NextResponse.json({
            success: false,
            error: 'Failed to verify payment'
        }, { status: 500 })
    }
}