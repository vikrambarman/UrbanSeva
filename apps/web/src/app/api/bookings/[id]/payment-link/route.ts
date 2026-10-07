// apps/web/src/app/api/bookings/[id]/payment-link/route.ts
/**
 * WHAT: Generate Razorpay Payment Link for POD bookings
 * WHY: 
 * - Provider "Collect Payment" button dabayega
 * - System Razorpay payment link generate karega
 * - Link provider ke app mein khulega
 * - Customer provider ke phone pe payment karega
 * NOTE: Payment link 24 hours valid rahega
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getProviderUser } from '@/lib/auth'

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

        // Fetch booking with details
        const booking = await db.booking.findUnique({
            where: { id: bookingId },
            include: {
                user: { select: { id: true, name: true, phone: true, email: true } },
                provider: { select: { id: true, userId: true } },
                service: { select: { name: true } }
            }
        })

        if (!booking) {
            return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 })
        }

        // Verify provider owns this booking
        if (booking.provider?.userId !== providerAuth.userId) {
            return NextResponse.json({ success: false, error: 'Not authorized for this booking' }, { status: 403 })
        }

        // Check if payment link already exists
        if (booking.razorpayPaymentLinkId) {
            return NextResponse.json({
                success: true,
                data: {
                    paymentLink: booking.razorpayPaymentLinkUrl,
                    paymentLinkId: booking.razorpayPaymentLinkId,
                    amount: booking.totalAmount,
                    message: 'Payment link already generated'
                }
            })
        }

        // Calculate amount (in paise for Razorpay)
        const amountInPaise = Math.round(booking.totalAmount * 100)

        // Create Razorpay Payment Link
        const razorpayKey = process.env.RAZORPAY_KEY_ID
        const razorpaySecret = process.env.RAZORPAY_KEY_SECRET

        if (!razorpayKey || !razorpaySecret) {
            // DEV MODE: Return mock payment link for testing
            const mockLink = `http://localhost:3000/mock-payment?bookingId=${bookingId}&amount=${booking.totalAmount}`
            
            await db.booking.update({
                where: { id: bookingId },
                data: {
                    razorpayPaymentLinkId: `mock_${Date.now()}`,
                    razorpayPaymentLinkUrl: mockLink,
                }
            })

            return NextResponse.json({
                success: true,
                data: {
                    paymentLink: mockLink,
                    paymentLinkId: `mock_${Date.now()}`,
                    amount: booking.totalAmount,
                    isMock: true,
                    message: 'Mock payment link generated (DEV MODE)'
                }
            })
        }

        // Production: Create actual Razorpay payment link
        const response = await fetch('https://api.razorpay.com/v1/payment_links', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${Buffer.from(`${razorpayKey}:${razorpaySecret}`).toString('base64')}`
            },
            body: JSON.stringify({
                amount: amountInPaise,
                currency: 'INR',
                accept_partial: false,
                description: `Payment for ${booking.service.name} - Booking #${booking.bookingNumber}`,
                customer: {
                    name: booking.user.name || 'Customer',
                    contact: booking.user.phone,
                    email: booking.user.email || undefined
                },
                notify: {
                    sms: true,
                    email: false
                },
                reminder_enable: true,
                notes: {
                    bookingId: booking.id,
                    bookingNumber: booking.bookingNumber,
                    providerId: booking.provider?.id || '',
                },
                callback_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/payment/success?bookingId=${bookingId}`,
                callback_method: 'get',
                expiry_by: Math.floor((Date.now() + 24 * 60 * 60 * 1000) / 1000), // 24 hours
            })
        })

        const paymentLinkData = await response.json()

        if (!response.ok) {
            console.error('Razorpay Payment Link Error:', paymentLinkData)
            return NextResponse.json({
                success: false,
                error: 'Failed to create payment link',
                details: paymentLinkData
            }, { status: 500 })
        }

        // Save payment link to booking
        await db.booking.update({
            where: { id: bookingId },
            data: {
                razorpayPaymentLinkId: paymentLinkData.id,
                razorpayPaymentLinkUrl: paymentLinkData.short_url,
            }
        })

        return NextResponse.json({
            success: true,
            data: {
                paymentLink: paymentLinkData.short_url,
                paymentLinkId: paymentLinkData.id,
                amount: booking.totalAmount,
                message: 'Payment link generated successfully'
            }
        })

    } catch (error) {
        console.error('Payment Link Generation Error:', error)
        return NextResponse.json({
            success: false,
            error: 'Failed to generate payment link'
        }, { status: 500 })
    }
}