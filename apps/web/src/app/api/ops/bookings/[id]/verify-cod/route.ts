/**
 * WHAT: OPS verifies COD payment collection (FIXED)
 * WHY: 
 * - Schema fields ab exist karte hain
 * - Proper type checking
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

        if (booking.paymentMethod !== 'COD') {
            return NextResponse.json(
                { success: false, error: 'This is not a COD booking' },
                { status: 400 }
            )
        }

        // FIX: Check if already verified
        if (booking.codVerifiedBy) {
            return NextResponse.json(
                { success: false, error: 'COD already verified' },
                { status: 400 }
            )
        }

        // FIX: Use proper fallback
        const finalAmount = verifiedAmount || booking.codAmountCollected || booking.totalAmount

        await db.booking.update({
            where: { id: bookingId },
            data: {
                codAmountCollected: finalAmount,
                codVerifiedBy: user.userId,
                codVerifiedAt: new Date(),
                codDisputed: isDisputed || false,
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
                            status: 'SETTLED'
                        }
                    })
                }
            } else {
                await db.providerEarning.update({
                    where: { id: earning.id },
                    data: { status: 'SETTLED' }
                })
            }
        }

        await db.bookingAssignmentLog.create({
            data: {
                bookingId,
                actionBy: user.userId,
                action: 'COD_VERIFIED',
                // FIX: Use proper fallback
                fromValue: `₹${booking.codAmountCollected || booking.totalAmount}`,
                toValue: `₹${finalAmount}`,
                notes: notes || (isDisputed ? 'Amount disputed' : 'COD verified'),
            }
        })

        await db.bookingStatusHistory.create({
            data: {
                bookingId,
                status: booking.status,
                note: `COD verified: ₹${finalAmount}${isDisputed ? ' (Disputed)' : ''}${notes ? ` - ${notes}` : ''}`,
                changedBy: user.userId,
            }
        })

        if (booking.provider) {
            try {
                await sendNotification({
                    userId: booking.provider.userId,
                    title: 'COD Payment Verified',
                    body: `Your COD collection of ₹${finalAmount} for booking #${booking.bookingNumber} has been verified.`,
                    type: 'GENERAL',
                    referenceId: bookingId,
                })
            } catch (notifError) {
                console.error('Notification error:', notifError)
            }
        }

        return NextResponse.json({
            success: true,
            message: `COD verified: ₹${finalAmount}`,
            data: {
                verifiedAmount: finalAmount,
                isDisputed: isDisputed || false,
            }
        })

    } catch (error) {
        console.error('❌ COD verification error:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}