/**
 * WHAT: Production-ready booking creation API
 * WHY: 
 * - Use existing addressId from cart (not create new address every time)
 * - Initial status: PAYMENT_RECEIVED (OPS verification pending)
 * - Support both ONLINE and COD payment methods
 * - Send notification to customer after booking creation
 * NOTE: Backward compatible - old code will still work
 */

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { sendBookingReceived } from '@/lib/notifications'

export async function POST(request: Request) {
    try {
        // Verify authentication
        const authHeader = request.headers.get('authorization')
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const token = authHeader.substring(7)
        const payload = verifyToken(token)
        if (!payload) {
            return NextResponse.json(
                { success: false, error: 'Invalid token' },
                { status: 401 }
            )
        }

        const body = await request.json()
        const {
            serviceId,
            scheduledDate,
            scheduledTime,
            addressId, // NEW: Use existing address ID
            address, // LEGACY: Keep for backward compatibility
            specialInstructions,
            paymentMethod, // NEW: ONLINE or COD
            baseAmount,
            addOnAmount,
            totalAmount,
        } = body

        // Validate required fields
        if (!serviceId || !scheduledDate || !scheduledTime) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            )
        }

        // Determine address ID
        let finalAddressId = addressId

        // LEGACY: If addressId not provided, create new address (backward compatibility)
        if (!finalAddressId && address) {
            const createdAddress = await db.address.create({
                data: {
                    userId: payload.userId,
                    label: address.label,
                    fullAddress: address.fullAddress,
                    area: address.area,
                    landmark: address.landmark,
                    pincode: address.pincode,
                },
            })
            finalAddressId = createdAddress.id
        }

        if (!finalAddressId) {
            return NextResponse.json(
                { success: false, error: 'Address is required' },
                { status: 400 }
            )
        }

        // Generate booking number
        const bookingNumber = `BK${Date.now()}${Math.floor(Math.random() * 1000)}`

        // Create booking with NEW status flow
        const booking = await db.booking.create({
            data: {
                bookingNumber,
                userId: payload.userId,
                serviceId,
                addressId: finalAddressId,
                scheduledDate: new Date(scheduledDate),
                scheduledTime,
                baseAmount,
                addOnAmount: addOnAmount || 0,
                totalAmount,
                specialInstructions,
                paymentMethod: paymentMethod || 'ONLINE', // NEW: Payment method
                status: 'PAYMENT_RECEIVED', // NEW: Initial status (not PENDING)
                paymentStatus: paymentMethod === 'COD' ? 'PENDING' : 'PENDING',
            },
            include: {
                service: true,
                user: {
                    select: {
                        id: true,
                        name: true,
                        phone: true,
                    },
                },
            },
        })

        // Create payment record
        await db.payment.create({
            data: {
                bookingId: booking.id,
                amount: totalAmount,
                currency: 'INR',
                method: paymentMethod || 'ONLINE',
                status: paymentMethod === 'COD' ? 'PENDING' : 'PENDING',
            },
        })

        // Create status history
        await db.bookingStatusHistory.create({
            data: {
                bookingId: booking.id,
                status: 'PAYMENT_RECEIVED',
                note: paymentMethod === 'COD' 
                    ? 'Booking created via Cash on Delivery' 
                    : 'Payment received, waiting for OPS confirmation',
                changedBy: payload.userId,
            },
        })

        // Send notification to customer
        try {
            await sendBookingReceived(
                payload.userId,
                booking.user.phone,
                booking.bookingNumber,
                booking.totalAmount
            )
        } catch (notifError) {
            console.error('Notification error:', notifError)
            // Don't fail booking if notification fails
        }

        return NextResponse.json({
            success: true,
            message: 'Booking created successfully',
            data: booking,
        })
    } catch (error) {
        console.error('Create Booking Error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to create booking' },
            { status: 500 }
        )
    }
}