/**
 * WHAT: Payment verification with production status flow
 * WHY: 
 * - After payment, status becomes PENDING_CONFIRMATION (not CONFIRMED)
 * - OPS team will verify slot availability and confirm
 * - Customer receives "Booking received" notification
 * NOTE: Backward compatible with existing flow
 */

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { verifySignature } from '@/lib/razorpay'
import { sendPaymentSuccess } from '@/lib/notifications'

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 })
    }

    const body = await request.json()
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, bookingIds } = body

    // Verify signature
    const isValid = verifySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature)

    if (!isValid) {
      return NextResponse.json({ success: false, error: 'Invalid payment signature' }, { status: 400 })
    }

    // Find payment record
    const payment = await db.payment.findFirst({
      where: { razorpayOrderId },
    })

    if (!payment) {
      return NextResponse.json({ success: false, error: 'Payment record not found' }, { status: 404 })
    }

    // Update payment record
    await db.payment.update({
      where: { id: payment.id },
      data: {
        razorpayPaymentId,
        razorpaySignature,
        status: 'PAID',
        paidAt: new Date(),
      },
    })

    // Update bookings - NEW STATUS FLOW
    await db.booking.updateMany({
      where: {
        id: { in: bookingIds },
        userId: payload.userId,
      },
      data: {
        razorpayPaymentId,
        paymentStatus: 'PAID',
        status: 'PENDING_CONFIRMATION', // NEW: Waiting for OPS confirmation
      },
    })

    // Create status history for each booking
    for (const bookingId of bookingIds) {
      await db.bookingStatusHistory.create({
        data: {
          bookingId,
          status: 'PENDING_CONFIRMATION',
          note: 'Payment verified. Waiting for OPS team to confirm slot and assign provider.',
          changedBy: payload.userId,
        },
      })
    }

    // Send payment success notification
    try {
      const bookings = await db.booking.findMany({
        where: { id: { in: bookingIds } },
        include: { user: { select: { phone: true } } },
      })

      for (const booking of bookings) {
        await sendPaymentSuccess(
          booking.userId,
          booking.id,
          booking.totalAmount
        )
      }
    } catch (notifError) {
      console.error('Notification error:', notifError)
    }

    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully',
    })
  } catch (error) {
    console.error('Verify Payment Error:', error)
    return NextResponse.json({ success: false, error: 'Failed to verify payment' }, { status: 500 })
  }
}