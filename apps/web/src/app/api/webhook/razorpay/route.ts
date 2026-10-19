import { NextRequest, NextResponse } from 'next/server'
import crypto from 'node:crypto'
import { db } from '@/lib/db'
import { sendNotification } from '@/lib/notifications'

export async function POST(request: NextRequest) {
    console.log('═══════════════════════════════════════')
    console.log('🔔 RAZORPAY WEBHOOK RECEIVED')
    console.log('═══════════════════════════════════════')

    try {
        const rawBody = await request.text()
        const signature = request.headers.get('x-razorpay-signature')
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET

        if (!webhookSecret) {
            console.error('❌ RAZORPAY_WEBHOOK_SECRET missing in .env')
            return NextResponse.json({ success: false }, { status: 500 })
        }

        if (!signature) {
            console.error('❌ Missing X-Razorpay-Signature header')
            return NextResponse.json({ success: false }, { status: 400 })
        }

        // Verify signature
        const expectedSignature = crypto
            .createHmac('sha256', webhookSecret)
            .update(rawBody)
            .digest('hex')

        if (expectedSignature !== signature) {
            console.error(' Signature mismatch. Expected:', expectedSignature, 'Got:', signature)
            return NextResponse.json({ success: false }, { status: 400 })
        }

        const event = JSON.parse(rawBody)
        console.log('📩 Event type:', event.event)

        if (event.event === 'payment_link.paid') {
            const paymentLinkEntity = event.payload.payment_link.entity
            const paymentEntity = event.payload.payment.entity
            const orderEntity = event.payload.order.entity

            const paymentLinkId = paymentLinkEntity.id
            const razorpayPaymentId = paymentEntity.id
            const amountPaid = paymentEntity.amount / 100
            
            const bookingNumberFromNotes = orderEntity.notes?.bookingNumber 

            console.log('💳 Payment Link ID:', paymentLinkId)
            console.log('💳 Razorpay Payment ID:', razorpayPaymentId)
            console.log('💳 Booking Number (from notes):', bookingNumberFromNotes)

            let booking = await db.booking.findFirst({
                where: { razorpayPaymentLinkId: paymentLinkId },
                include: { payment: true, user: { select: { id: true, name: true } } }
            })

            if (!booking && bookingNumberFromNotes) {
                console.log('️ Booking not found by Link ID. Trying bookingNumber fallback...')
                booking = await db.booking.findFirst({
                    where: { bookingNumber: bookingNumberFromNotes },
                    include: { payment: true, user: { select: { id: true, name: true } } }
                })
            }

            if (!booking) {
                console.error('❌ Booking not found by Link ID or Booking Number!')
                return NextResponse.json({ success: true }) 
            }

            console.log('✅ Booking found:', booking.bookingNumber, 'Current Status:', booking.paymentStatus)

            if (booking.paymentStatus === 'PAID') {
                console.log('ℹ️ Already PAID, skipping.')
                return NextResponse.json({ success: true })
            }

            // Update Booking
            await db.booking.update({
                where: { id: booking.id },
                data: { 
                    paymentStatus: 'PAID',
                    razorpayPaymentLinkId: booking.razorpayPaymentLinkId || paymentLinkId 
                }
            })
            console.log('✅ Booking paymentStatus updated to PAID')

            // Update Payment Record
            if (booking.payment) {
                await db.payment.update({
                    where: { id: booking.payment.id },
                    data: {
                        status: 'PAID',
                        razorpayPaymentId,
                        paidAt: new Date()
                    }
                })
                console.log('✅ Payment record updated')
            } else {
                await db.payment.create({
                    data: {
                        bookingId: booking.id,
                        amount: amountPaid,
                        currency: 'INR',
                        method: 'RAZORPAY',
                        razorpayPaymentId,
                        status: 'PAID',
                        paidAt: new Date()
                    }
                })
                console.log('✅ Payment record created')
            }

            // ✅ FIX: Update Provider Earning for POD/COD payments
            if (booking.providerId && (booking.paymentMethod === 'POD' || booking.paymentMethod === 'COD')) {
                try {
                    await db.providerEarning.updateMany({
                        where: { 
                            bookingId: booking.id,
                            providerId: booking.providerId
                        },
                        data: {
                            status: 'SETTLED',
                            paymentMethod: booking.paymentMethod,
                            settledAt: new Date()
                        }
                    })
                    console.log('✅ Provider Earning updated to SETTLED')
                } catch (e) {
                    console.error('Provider earning update error:', e)
                }
            }

            // Status History
            await db.bookingStatusHistory.create({
                data: {
                    bookingId: booking.id,
                    status: booking.status,
                    note: `✅ Payment of ₹${amountPaid} confirmed via Razorpay Webhook (ID: ${razorpayPaymentId})`,
                    changedBy: booking.userId
                }
            })

            // Notification
            try {
                await sendNotification({
                    userId: booking.userId,
                    title: 'Payment Received ✅',
                    body: `Payment of ₹${amountPaid} for booking #${booking.bookingNumber} successful!`,
                    type: 'GENERAL',
                    referenceId: booking.id,
                })
            } catch (e) { console.error('Notification error:', e) }

            console.log('🎉 Webhook processing complete for booking:', booking.bookingNumber)
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('❌ Webhook fatal error:', error)
        return NextResponse.json({ success: false }, { status: 500 })
    }
}