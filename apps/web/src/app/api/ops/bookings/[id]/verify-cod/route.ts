/**
 * WHAT: OPS verifies Physical Cash POD/COD payment collection
 * WHY: 
 * - Only for Physical Cash POD (Razorpay Link POD auto-settles)
 * - Adjusts base/commission proportionally if verified amount differs
 * - Credits Provider Wallet and creates Company Ledger entries
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

        // FIX: Support both COD and POD, but ONLY physical cash (no Razorpay link)
        if ((booking.paymentMethod !== 'COD' && booking.paymentMethod !== 'POD') || booking.razorpayPaymentLinkId) {
            return NextResponse.json(
                { success: false, error: 'This is not a Physical Cash COD/POD booking' },
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
        const ratio = finalAmount / booking.totalAmount;

        // Calculate adjusted financials
        const adjBase = booking.baseAmount * ratio;
        const adjComm = booking.companyCommission * ratio;
        const adjEarn = booking.providerEarningAmt * ratio;
        const adjGst = (booking.cgstAmount + booking.sgstAmount) * ratio;

        // ═══════════════════════════════
        // DB TRANSACTION: Update everything atomically
        // ═══════════════════════════════
        await db.$transaction(async (tx) => {
            // 1. Update Booking
            await tx.booking.update({
                where: { id: bookingId },
                data: {
                    codAmountCollected: finalAmount,
                    codVerifiedBy: user.userId,
                    codVerifiedAt: new Date(),
                    codDisputed: isDisputed || false,
                    paymentStatus: 'PAID',
                }
            });

            // 2. Update Payment Record
            await tx.payment.updateMany({
                where: { bookingId },
                data: { status: 'PAID', paidAt: new Date() }
            });

            // 3. Upsert Provider Earning
            const earning = await tx.providerEarning.upsert({
                where: { bookingId },
                update: {
                    gross: adjBase,
                    commission: adjComm,
                    net: adjEarn,
                    status: 'SETTLED',
                    settledAt: new Date(),
                    collectedAmount: finalAmount,
                    collectedAt: new Date(),
                },
                create: {
                    providerId: booking.providerId!,
                    bookingId: bookingId,
                    gross: adjBase,
                    commission: adjComm,
                    net: adjEarn,
                    status: 'SETTLED',
                    settledAt: new Date(),
                    paymentMethod: booking.paymentMethod!,
                    collectedAmount: finalAmount,
                    collectedAt: new Date(),
                }
            });

            // 4. Credit Provider Wallet
            const updatedProvider = await tx.provider.update({
                where: { id: booking.providerId! },
                data: { walletBalance: { increment: adjEarn } }
            });

            // 5. Create Wallet Transaction
            const walletTxn = await tx.providerWalletTransaction.create({
                data: {
                    providerId: booking.providerId!,
                    type: 'EARNING_CREDIT',
                    amount: adjEarn,
                    balanceAfter: updatedProvider.walletBalance,
                    description: `Physical Cash POD Earning from booking #${booking.bookingNumber}`,
                    bookingId: bookingId,
                }
            });

            // 6. Link Wallet Txn to Earning
            await tx.providerEarning.update({
                where: { id: earning.id },
                data: { walletTxnId: walletTxn.id }
            });

            // 7. Create Company Ledger Entries
            await tx.companyLedger.createMany({
                data: [
                    { 
                        type: 'COMMISSION_CREDIT', 
                        amount: adjComm, 
                        description: `Commission from Physical POD #${booking.bookingNumber}`, 
                        bookingId: bookingId 
                    },
                    { 
                        type: 'GST_COLLECTED', 
                        amount: adjGst, 
                        description: `GST from Physical POD #${booking.bookingNumber}`, 
                        bookingId: bookingId 
                    }
                ]
            });
        });

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
                    body: `Your ${booking.paymentMethod} collection of ₹${finalAmount} for booking #${booking.bookingNumber} has been verified and added to your wallet.`,
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