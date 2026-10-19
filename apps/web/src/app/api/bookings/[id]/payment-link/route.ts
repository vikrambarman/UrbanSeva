// apps/web/src/app/api/bookings/[id]/payment-link/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getProviderUser } from '@/lib/auth'
import { createPaymentLink } from '@/lib/razorpay'

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const providerAuth = await getProviderUser(request)
        if (!providerAuth) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

        const { id } = await params

        const booking = await db.booking.findUnique({
            where: { id },
            include: {
                user: { select: { name: true, phone: true, email: true } }
            }
        })
        if (!booking) return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 })

        // Return existing link if already generated
        if (booking.razorpayPaymentLinkId) {
            return NextResponse.json({
                success: true,
                data: {
                    paymentLink: booking.razorpayPaymentLinkUrl,
                    paymentLinkId: booking.razorpayPaymentLinkId
                },
                message: 'Payment link already generated'
            })
        }

        const linkRes = await createPaymentLink(
            booking.totalAmount,
            'INR',
            booking.user.phone,
            booking.user.name || 'Customer',   // ✅ FIX: null fallback
            booking.bookingNumber,
            booking.user.email || undefined
        )

        if (!linkRes.success) {
            return NextResponse.json({ success: false, error: linkRes.error }, { status: 500 })
        }

        await db.booking.update({
            where: { id },
            data: {
                razorpayPaymentLinkId: linkRes.paymentLinkId,
                razorpayPaymentLinkUrl: linkRes.paymentLinkUrl
            }
        })

        return NextResponse.json({
            success: true,
            data: {
                paymentLink: linkRes.paymentLinkUrl,
                paymentLinkId: linkRes.paymentLinkId
            }
        })
    } catch (error) {
        console.error('Payment Link Generate Error:', error)
        return NextResponse.json({ success: false, error: 'Failed to generate payment link' }, { status: 500 })
    }
}