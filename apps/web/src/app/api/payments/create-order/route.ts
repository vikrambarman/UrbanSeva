/**
 * WHAT: Razorpay order creation API (FIXED)
 * WHY: 
 * - Remove duplicate payment record creation (already created in booking create)
 * - Update existing payment record with razorpayOrderId
 * - Better error handling and validation
 * NOTE: Backward compatible
 */

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { createOrder } from '@/lib/razorpay'

export async function POST(request: Request) {
  try {
    console.log('═══════════════════════════════════════')
    console.log('📦 Create Order API Called')
    console.log('═══════════════════════════════════════')

    // Verify authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('❌ Unauthorized - No Bearer token')
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const payload = verifyToken(token)
    if (!payload) {
      console.error('❌ Invalid token')
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 })
    }

    console.log('✅ User authenticated:', payload.userId)

    const body = await request.json()
    const { bookingIds } = body

    console.log('Booking IDs:', bookingIds)

    if (!bookingIds || !Array.isArray(bookingIds) || bookingIds.length === 0) {
      console.error('❌ No bookings provided')
      return NextResponse.json({ success: false, error: 'No bookings provided' }, { status: 400 })
    }

    // Fetch all bookings
    const bookings = await db.booking.findMany({
      where: {
        id: { in: bookingIds },
        userId: payload.userId,
      },
      select: {
        id: true,
        totalAmount: true,
        paymentStatus: true,
      },
    })

    console.log('Found bookings:', bookings.length)

    if (bookings.length !== bookingIds.length) {
      console.error('❌ Some bookings not found')
      return NextResponse.json({ success: false, error: 'Some bookings not found' }, { status: 404 })
    }

    // ✅ FIX: Calculate total amount with validation
    const totalAmount = bookings.reduce((sum, b) => sum + b.totalAmount, 0)

    console.log('Total Amount:', totalAmount)

    if (totalAmount <= 0) {
      console.error('❌ Invalid total amount:', totalAmount)
      return NextResponse.json(
        { success: false, error: 'Invalid booking amount. Total must be greater than 0' },
        { status: 400 }
      )
    }

    // Create Razorpay order
    console.log('Creating Razorpay order...')
    const orderResult = await createOrder(totalAmount)

    if (!orderResult.success) {
      console.error('❌ Order creation failed:', orderResult.error)
      return NextResponse.json(
        { 
          success: false, 
          error: orderResult.error,
          details: orderResult.details 
        }, 
        { status: 500 }
      )
    }

    console.log('✅ Order created:', orderResult.orderId)

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

    console.log('✅ Bookings and payments updated')
    console.log('═══════════════════════════════════════')

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
    console.error('═══════════════════════════════════════')
    console.error('❌ Create Order API Error')
    console.error('═══════════════════════════════════════')
    console.error('Error:', error.message)
    console.error('Stack:', error.stack)
    console.error('═══════════════════════════════════════')
    
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