/**
 * WHAT: OPS verifies POD/COD payment collection
 * WHY: 
 * - POD bookings ke liye bhi verification
 * - Payment link se payment aaya hai ya nahi
 * - Earning status SETTLED hoga
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCallingTeamUser } from '@/lib/auth'
import { sendNotification } from '@/lib/notifications'

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCallingTeamUser(request)
        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const { id: bookingId } = await params
        const body = await request.json()
        const { verifiedAmount, notes, isDisputed } = body

        const booking = await db.booking.findUnique({
            where: { id: bookingId },
            include: {
                user: { select: { id: true, name: true, phone: true } },
                provider: { include: { user: { select: { name: true } } } },
            }
        })

        if (!booking) {
            return NextResponse.json(
                { success: false, error: 'Booking not found' },
                { status: 404 }
            )
        }

        // FIX: Support both COD and POD
        if (booking.paymentMethod !== 'COD' && booking.paymentMethod !== 'POD') {
            return NextResponse.json(
                { success: false, error: 'This is not a COD/POD booking' },
                { status: 400 }
            )
        }

        // Check if already verified
        if (booking.codVerifiedBy && booking.paymentStatus === 'PAID') {
            return NextResponse.json(
                { success: false, error: 'Payment already verified' },
                { status: 400 }
            )
        }

        const finalAmount = verifiedAmount || booking.codAmountCollected || booking.totalAmount

        await db.booking.update({
            where: { id: bookingId },
            data: {
                codAmountCollected: finalAmount,
                codVerifiedBy: user.userId,
                codVerifiedAt: new Date(),
                codDisputed: isDisputed || false,
                paymentStatus: 'PAID',
            }
        })

        // Update payment record
        await db.payment.updateMany({
            where: { bookingId },
            data: {
                status: 'PAID',
                paidAt: new Date(),
            }
        })

        const earning = await db.providerEarning.findFirst({
            where: { bookingId }
        })

        if (earning) {
            if (finalAmount !== earning.gross) {
                const provider = await db.provider.findUnique({
                    where: { id: earning.providerId }
                })
                
                if (provider) {
                    const commission = finalAmount * (provider.commissionRate / 100)
                    const net = finalAmount - commission
                    
                    await db.providerEarning.update({
                        where: { id: earning.id },
                        data: {
                            gross: finalAmount,
                            commission,
                            net,
                            status: 'SETTLED',
                            settledAt: new Date(),
                        }
                    })
                }
            } else {
                await db.providerEarning.update({
                    where: { id: earning.id },
                    data: { 
                        status: 'SETTLED',
                        settledAt: new Date(),
                    }
                })
            }
        }

        await db.bookingAssignmentLog.create({
            data: {
                bookingId,
                actionBy: user.userId,
                action: 'PAYMENT_VERIFIED',
                fromValue: `₹${booking.codAmountCollected || booking.totalAmount}`,
                toValue: `₹${finalAmount}`,
                notes: notes || (isDisputed ? 'Amount disputed' : `${booking.paymentMethod} verified`),
            }
        })

        await db.bookingStatusHistory.create({
            data: {
                bookingId,
                status: booking.status,
                note: `${booking.paymentMethod} verified: ₹${finalAmount}${isDisputed ? ' (Disputed)' : ''}${notes ? ` - ${notes}` : ''}`,
                changedBy: user.userId,
            }
        })

        if (booking.provider) {
            try {
                await sendNotification({
                    userId: booking.provider.userId,
                    title: 'Payment Verified',
                    body: `Your ${booking.paymentMethod} collection of ₹${finalAmount} for booking #${booking.bookingNumber} has been verified.`,
                    type: 'GENERAL',
                    referenceId: bookingId,
                })
            } catch (notifError) {
                console.error('Notification error:', notifError)
            }
        }

        return NextResponse.json({
            success: true,
            message: `${booking.paymentMethod} verified: ₹${finalAmount}`,
            data: {
                verifiedAmount: finalAmount,
                isDisputed: isDisputed || false,
            }
        })

    } catch (error) {
        console.error('❌ Payment verification error:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}