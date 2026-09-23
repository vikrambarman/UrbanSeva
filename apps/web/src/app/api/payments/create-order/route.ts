import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { createOrder } from '@/lib/razorpay'

export async function POST(request: Request) {
  try {
    console.log('Create Order API called')

    // Verify authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('No authorization header')
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const payload = verifyToken(token)
    if (!payload) {
      console.error('Invalid token')
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 })
    }

    console.log('User authenticated:', payload.userId)

    const body = await request.json()
    const { bookingIds } = body

    console.log('Booking IDs:', bookingIds)

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

    console.log('Found bookings:', bookings.length)

    if (bookings.length !== bookingIds.length) {
      return NextResponse.json({ success: false, error: 'Some bookings not found' }, { status: 404 })
    }

    // Calculate total amount
    const totalAmount = bookings.reduce((sum, b) => sum + b.totalAmount, 0)
    console.log('Total amount:', totalAmount)

    // Create Razorpay order
    const orderResult = await createOrder(totalAmount)

    if (!orderResult.success) {
      console.error('Order creation failed:', orderResult.error)
      return NextResponse.json(
        { 
          success: false, 
          error: orderResult.error,
          details: orderResult.details 
        }, 
        { status: 500 }
      )
    }

    console.log('Order created successfully:', orderResult.orderId)

    // Update bookings with order ID
    await db.booking.updateMany({
      where: { id: { in: bookingIds } },
      data: {
        razorpayOrderId: orderResult.orderId,
        paymentStatus: 'PENDING',
      },
    })

    // Create payment record
    await db.payment.create({
      data: {
        bookingId: bookingIds[0],
        amount: totalAmount,
        currency: 'INR',
        razorpayOrderId: orderResult.orderId,
        status: 'PENDING',
      },
    })

    console.log('Payment record created')

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
    console.error('Error stack:', error.stack)
    
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