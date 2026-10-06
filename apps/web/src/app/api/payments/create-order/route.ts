/**
 * WHAT: Razorpay order creation API (FIXED)
 * WHY: 
 * - Remove duplicate payment record creation (already created in booking create)
 * - Update existing payment record with razorpayOrderId
 * NOTE: Backward compatible
 */

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { createOrder } from '@/lib/razorpay'

export async function POST(request: Request) {
  try {
    // Verify authentication
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
    const { bookingIds } = body

    if (!bookingIds || bookingIds.length === 0) {
      return NextResponse.json({ success: false, error: 'No bookings provided' }, { status: 400 })
    }

    // Fetch all bookings
    const bookings = await db.booking.findMany({
      where: {
        id: { in: bookingIds },
        userId: payload.userId,
      },
    })

    if (bookings.length !== bookingIds.length) {
      return NextResponse.json({ success: false, error: 'Some bookings not found' }, { status: 404 })
    }

    // Calculate total amount
    const totalAmount = bookings.reduce((sum, b) => sum + b.totalAmount, 0)

    // Create Razorpay order
    const orderResult = await createOrder(totalAmount)

    if (!orderResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: orderResult.error,
          details: orderResult.details 
        }, 
        { status: 500 }
      )
    }

    // Update bookings with order ID
    await db.booking.updateMany({
      where: { id: { in: bookingIds } },
      data: {
        razorpayOrderId: orderResult.orderId,
      },
    })

    // UPDATE existing payment record (not create new)
    await db.payment.updateMany({
      where: { 
        bookingId: { in: bookingIds } 
      },
      data: {
        razorpayOrderId: orderResult.orderId,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        orderId: orderResult.orderId,
        amount: orderResult.amount,
        currency: orderResult.currency,
        keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID,
      },
    })
  } catch (error: any) {
    console.error('Create Order API Error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create order',
        details: error.message 
      }, 
      { status: 500 }
    )
  }
}