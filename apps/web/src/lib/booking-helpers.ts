/**
 * WHAT: Shared booking cancellation + refund logic
 * WHY: Used by both customer/OPS cancel API and Provider reject action
 *      to avoid duplicate logic and ensure consistent refund policy across the app
 */

import { db } from '@/lib/db'
import { processRefund } from '@/lib/razorpay'
import { sendNotification, sendSMS } from '@/lib/notifications'
import Razorpay from 'razorpay'

type CancelledBy = 'CUSTOMER' | 'OPS' | 'PROVIDER'

export async function cancelBookingWithRefund(
    bookingId: string,
    cancelledBy: CancelledBy,
    reason: string,
    changedByUserId: string
) {
    const booking = await db.booking.findUnique({
        where: { id: bookingId },
        include: {
            payment: true,
            user: { select: { id: true, name: true, phone: true } },
            service: { select: { name: true } }
        }
    })

    if (!booking) {
        return { success: false, error: 'Booking not found' }
    }

    if (['CANCELLED', 'CANCELLED_BY_CUSTOMER', 'CANCELLED_BY_OPS', 'CANCELLED_BY_PROVIDER'].includes(booking.status)) {
        return { success: false, error: 'Booking already cancelled' }
    }

    // ═══════════════════════════════
    // Calculate refund % based on timing
    // ═══════════════════════════════
    const scheduledDateTime = new Date(`${booking.scheduledDate.toISOString().split('T')[0]}T${booking.scheduledTime}`)
    const now = new Date()
    const hoursUntilService = (scheduledDateTime.getTime() - now.getTime()) / (1000 * 60 * 60)

    let refundPercentage = 100

    if (cancelledBy === 'CUSTOMER') {
        if (hoursUntilService >= 24) refundPercentage = 100
        else if (hoursUntilService >= 12) refundPercentage = 50
        else refundPercentage = 0
    } else {
        refundPercentage = 100 // OPS/Provider cancel = always 100%
    }

    const refundAmount = (booking.totalAmount * refundPercentage) / 100

    const newStatus = cancelledBy === 'CUSTOMER'
        ? 'CANCELLED_BY_CUSTOMER'
        : cancelledBy === 'OPS'
        ? 'CANCELLED_BY_OPS'
        : 'CANCELLED_BY_PROVIDER'

    let refundId: string | null = null
    let isWalletRefund = false

    // ═══════════════════════════════
    // Process refund if payment was made
    // ═══════════════════════════════
    if (booking.paymentStatus === 'PAID' && refundAmount > 0) {
        if (booking.payment?.method === 'WALLET') {
            await db.user.update({
                where: { id: booking.userId },
                data: { walletBalance: { increment: refundAmount } }
            })
            await db.walletTransaction.create({
                data: {
                    userId: booking.userId,
                    type: 'REFUND',
                    amount: refundAmount,
                    balance: 0,
                    description: `Refund for cancelled booking #${booking.bookingNumber}`,
                    referenceId: booking.id
                }
            })
            isWalletRefund = true
        } else if (booking.payment?.razorpayPaymentId) {
            const refundResult = await processRefund(
                booking.payment.razorpayPaymentId,
                refundAmount,
                'optimum'
            )
            if (refundResult.success) {
                refundId = refundResult.refundId as string
            } else {
                console.error('Refund failed:', refundResult.error)
            }
        }
    }

    // ═══════════════════════════════
    // ✅ NEW: Cancel pending POD Payment Link if exists
    // WHY: Agar provider ne "Start Service" kiya tha aur Payment Link
    //      generate ho gaya tha, lekin payment abhi baaki hai, aur booking
    //      cancel ho rahi hai — toh us link ko invalidate karna zaroori hai
    //      taaki customer purane link se payment na kar sake.
    // ⚠️ NOTE: `razorpay.paymentLink.cancel()` method ka exact behavior
    //      Razorpay SDK version ke hisaab se verify kar lena — agar yeh
    //      method available nahi hai toh ise try/catch non-blocking rakha hai.
    // ═══════════════════════════════
    if (booking.razorpayPaymentLinkId && booking.paymentStatus !== 'PAID') {
        try {
            const razorpay = new Razorpay({
                key_id: process.env.RAZORPAY_KEY_ID!,
                key_secret: process.env.RAZORPAY_KEY_SECRET!
            })
            await razorpay.paymentLink.cancel(booking.razorpayPaymentLinkId)
            console.log(`[Cancel] Payment link ${booking.razorpayPaymentLinkId} cancelled`)
        } catch (linkCancelError) {
            console.error('Payment link cancellation error (non-blocking):', linkCancelError)
        }
    }

    // ═══════════════════════════════
    // Update booking + payment + history
    // ═══════════════════════════════
    await db.booking.update({
        where: { id: bookingId },
        data: {
            status: newStatus,
            cancelReason: reason || 'Cancelled',
            cancelledAt: new Date(),
            paymentStatus: refundAmount > 0 ? (isWalletRefund ? 'REFUNDED' : 'REFUND_INITIATED') : booking.paymentStatus,
        }
    })

    if (booking.payment && refundAmount > 0) {
        await db.payment.update({
            where: { id: booking.payment.id },
            data: {
                status: isWalletRefund ? 'REFUNDED' : (refundId ? 'REFUNDED' : 'REFUND_INITIATED'),
                refundAmount,
                refundId,
                refundedAt: (refundId || isWalletRefund) ? new Date() : null,
            }
        })
    }

    await db.bookingStatusHistory.create({
        data: {
            bookingId,
            status: newStatus,
            note: `Booking cancelled by ${cancelledBy}. Reason: ${reason || 'Not provided'}. Refund: ₹${refundAmount} (${refundPercentage}%)`,
            changedBy: changedByUserId
        }
    })

    // ═══════════════════════════════
    // Notifications
    // ═══════════════════════════════
    try {
        await sendNotification({
            userId: booking.userId,
            title: 'Booking Cancelled',
            body: `Your booking #${booking.bookingNumber} has been cancelled. ${refundAmount > 0 ? `Refund of ₹${refundAmount} will be processed.` : ''}`,
            type: 'GENERAL',
            referenceId: booking.id,
        })

        if (booking.user.phone) {
            const smsMessage = refundAmount > 0
                ? `Booking #${booking.bookingNumber} cancelled. Refund of Rs.${refundAmount} will be processed within 5-7 days. - HomeServices`
                : `Booking #${booking.bookingNumber} cancelled. - HomeServices`

            await sendSMS({
                phone: booking.user.phone,
                message: smsMessage,
                type: 'GENERAL',
            })
        }
    } catch (notifError) {
        console.error('Notification error:', notifError)
    }

    return {
        success: true,
        data: { refundAmount, refundPercentage, refundId }
    }
}