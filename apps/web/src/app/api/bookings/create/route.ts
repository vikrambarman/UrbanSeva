// api/bookings/create/route.ts

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

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
            address,
            specialInstructions,
            baseAmount,
            addOnAmount,
            totalAmount,
        } = body

        // Validate required fields
        if (!serviceId || !scheduledDate || !scheduledTime || !address) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            )
        }

        // Create address first
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

        // Generate booking number
        const bookingNumber = `BK${Date.now()}${Math.floor(Math.random() * 1000)}`

        // Create booking
        const booking = await db.booking.create({
            data: {
                bookingNumber,
                userId: payload.userId,
                serviceId,
                addressId: createdAddress.id,
                scheduledDate: new Date(scheduledDate),
                scheduledTime,
                baseAmount,
                addOnAmount: addOnAmount || 0,
                totalAmount,
                specialInstructions,
                status: 'PENDING',
                paymentStatus: 'PENDING',
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

        // ═══════════════════════════════════════════════════════════════
        // ✅ FIX: Payment record create karo — PENDING status ke saath
        // Pehle ye missing tha — isliye admin panel mein payment tab khali rehta tha
        // Jab /api/payments/create-order call hoga, tab ye record update hoga
        // razorpayOrderId ke saath, aur /api/payments/verify mein status PAID hoga
        // ═══════════════════════════════════════════════════════════════
        await db.payment.create({
            data: {
                bookingId: booking.id,
                amount: totalAmount,
                currency: 'INR',
                status: 'PENDING',
            },
        })

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