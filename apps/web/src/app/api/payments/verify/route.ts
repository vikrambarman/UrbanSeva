import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { verifySignature } from '@/lib/razorpay'

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

    // Find payment record using razorpayOrderId (findFirst instead of update)
    const payment = await db.payment.findFirst({
      where: { razorpayOrderId },
    })

    if (!payment) {
      return NextResponse.json({ success: false, error: 'Payment record not found' }, { status: 404 })
    }

    // Update payment record using id
    await db.payment.update({
      where: { id: payment.id },
      data: {
        razorpayPaymentId,
        razorpaySignature,
        status: 'PAID',
        paidAt: new Date(),
      },
    })

    // Update bookings
    await db.booking.updateMany({
      where: {
        id: { in: bookingIds },
        userId: payload.userId,
      },
      data: {
        razorpayPaymentId,
        paymentStatus: 'PAID',
        status: 'CONFIRMED',
      },
    })

    // Create status history for each booking
    for (const bookingId of bookingIds) {
      await db.bookingStatusHistory.create({
        data: {
          bookingId,
          status: 'CONFIRMED',
          note: 'Payment received successfully',
          changedBy: payload.userId,
        },
      })
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