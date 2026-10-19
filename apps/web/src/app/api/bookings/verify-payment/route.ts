// apps/web/src/app/api/bookings/verify-payment/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import Razorpay from 'razorpay'

// Razorpay instance
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!
})

export async function POST(request: NextRequest) {
    console.log('═══════════════════════════════════════')
    console.log(' VERIFY PAYMENT API CALLED')
    console.log('═══════════════════════════════════════')

    try {
        const body = await request.json()
        const { bookingNumber, paymentLinkId, paymentId } = body

        console.log('📦 Received Payload:', { bookingNumber, paymentLinkId, paymentId })

        if (!bookingNumber || !paymentLinkId) {
            console.error('❌ Missing bookingNumber or paymentLinkId')
            return NextResponse.json({ success: false, error: 'Missing details' }, { status: 400 })
        }

        // 1. DB se Booking dhundho
        console.log('🔎 Searching DB for bookingNumber:', bookingNumber)
        const booking = await db.booking.findUnique({
            where: { bookingNumber },
            include: { payment: true }
        })

        if (!booking) {
            console.error('❌ Booking NOT FOUND in DB for number:', bookingNumber)
            return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 })
        }

        console.log('✅ Booking Found. ID:', booking.id, 'Current Status:', booking.paymentStatus)

        // Agar already paid hai, toh yahi se return kar do
        if (booking.paymentStatus === 'PAID') {
            console.log('️ Booking already marked as PAID. Skipping.')
            return NextResponse.json({ success: true, message: 'Already verified' })
        }

        // 2. Razorpay API se status check karo
        console.log(' Fetching status from Razorpay API for Link ID:', paymentLinkId)
        let isPaidOnRazorpay = false

        try {
            const paymentLink = await razorpay.paymentLink.fetch(paymentLinkId)
            console.log(' Razorpay Response Status:', paymentLink.status)
            
            if (paymentLink.status === 'paid') {
                isPaidOnRazorpay = true
            }
        } catch (razorpayError: any) {
            console.error('⚠️ Razorpay API Fetch Error:', razorpayError.message)
            console.error('⚠️ Razorpay Error Code:', razorpayError.statusCode)
            
            // Fallback: Agar Razorpay API fail ho jaye, toh URL param `razorpay_payment_link_status=paid` pe trust karo
            // (Kyunki Razorpay redirect URL ko sign karta hai)
            console.log('⚠️ Falling back to URL param trust...')
            // Note: Hum frontend se isko explicitly pass karwa sakte hain, but for now, let's rely on the API.
        }

        // 3. DB Update Karo (Agar Razorpay ne paid bola, ya hum fallback use kar rahe hain)
        // Hum yahan thoda aggressive hain: Agar paymentLinkId valid hai aur Razorpay ne error nahi diya, toh update karo.
        // Lekin safest way: sirf tab update karo jab Razorpay API 'paid' bole.
        
        if (isPaidOnRazorpay) {
            console.log('💾 Updating DB: Setting paymentStatus to PAID...')
            await db.booking.update({
                where: { id: booking.id },
                data: { paymentStatus: 'PAID' }
            })

            const finalPaymentId = paymentId || booking.payment?.razorpayPaymentId || 'unknown'

            if (booking.payment) {
                console.log('💾 Updating Payment Record...')
                await db.payment.update({
                    where: { id: booking.payment.id },
                    data: {
                        status: 'PAID',
                        razorpayPaymentId: finalPaymentId,
                        paidAt: new Date()
                    }
                })
            } else {
                console.log('💾 Creating new Payment Record...')
                await db.payment.create({
                    data: {
                        bookingId: booking.id,
                        amount: booking.totalAmount,
                        currency: 'INR',
                        method: 'RAZORPAY',
                        razorpayPaymentId: finalPaymentId,
                        status: 'PAID',
                        paidAt: new Date()
                    }
                })
            }
            
            console.log('🎉 SUCCESS: DB Updated for booking', bookingNumber)
            return NextResponse.json({ success: true, message: 'Payment verified and DB updated' })
        } else {
            console.error('❌ Razorpay says payment is NOT paid. Status:', 'unknown')
            return NextResponse.json({ success: false, error: 'Payment not completed on Razorpay' })
        }

    } catch (error: any) {
        console.error('💥 FATAL ERROR IN VERIFY API:', error.message)
        console.error('💥 Stack Trace:', error.stack)
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
    }
}