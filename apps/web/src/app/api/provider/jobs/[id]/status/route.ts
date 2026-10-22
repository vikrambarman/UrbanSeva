/**
 * WHAT: Provider job status update with POD/Online payment handling
 * WHY: 
 * - Commission is now calculated on BASE amount (GST exclusive)
 * - Online & Razorpay Link POD earnings auto-settle to Provider Wallet
 * - Physical Cash POD earnings stay PENDING_VERIFICATION until OPS verifies
 * - Company Ledger entries are created for commission and GST tracking
 * NOTE: Provider "Collect Payment" button dabayega POD ke liye (Phase 4 mein)
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getProviderUser } from '@/lib/auth'
import { sendNotification } from '@/lib/notifications'
import { cancelBookingWithRefund } from '@/lib/booking-helpers'

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const providerAuth = await getProviderUser(request)
        if (!providerAuth) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

        const provider = await db.provider.findUnique({
            where: { userId: providerAuth.userId },
            include: { user: { select: { name: true } } }
        })
        if (!provider) return NextResponse.json({ success: false, error: 'Provider not found' }, { status: 404 })

        const { id } = await params
        const body = await request.json()
        const { action, photos, codAmountCollected } = body

        const booking = await db.booking.findUnique({
            where: { id },
            include: {
                user: { select: { id: true, name: true, phone: true, email: true } },
                service: {
                    select: {
                        name: true,
                        subCategory: { include: { category: true } }
                    }
                },
            }
        })
        if (!booking) return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 })

        let newStatus = booking.status
        let updateData: any = {}
        const paymentMethod = booking.paymentMethod || 'ONLINE'
        const isRazorpayPod = !!booking.razorpayPaymentLinkId

        switch (action) {
            case 'accept':
                newStatus = 'CONFIRMED'
                await db.provider.update({
                    where: { id: provider.id },
                    data: { currentWorkStatus: 'AVAILABLE' }
                })
                break

            case 'reject': {
                const cancelResult = await cancelBookingWithRefund(
                    booking.id,
                    'PROVIDER',
                    body.reason || 'Rejected by provider',
                    providerAuth.userId
                )

                await db.provider.update({
                    where: { id: provider.id },
                    data: { currentWorkStatus: 'AVAILABLE', currentJobId: null }
                })

                if (!cancelResult.success) {
                    return NextResponse.json({ success: false, error: cancelResult.error }, { status: 400 })
                }

                return NextResponse.json({
                    success: true,
                    message: `Job rejected. Refund of ₹${cancelResult.data?.refundAmount} processed for customer.`,
                    data: { status: 'CANCELLED_BY_PROVIDER' }
                })
            }

            case 'start':
                newStatus = 'SERVICE_STARTED'
                updateData.startedAt = new Date()
                await db.provider.update({
                    where: { id: provider.id },
                    data: { currentWorkStatus: 'WORKING' }
                })

                // 🚀 POD: Auto-generate Payment Link when service starts (Only for physical POD, not if already generated)
                if ((paymentMethod === 'POD' || paymentMethod === 'COD') && !isRazorpayPod) {
                    try {
                        const { createPaymentLink } = await import('@/lib/razorpay')
                        const linkRes = await createPaymentLink(
                            booking.totalAmount,
                            'INR',
                            booking.user.phone,
                            booking.user.name || 'Customer',   
                            booking.bookingNumber,
                            booking.user.email || undefined
                        )

                        if (linkRes.success) {
                            updateData.razorpayPaymentLinkId = linkRes.paymentLinkId
                            updateData.razorpayPaymentLinkUrl = linkRes.paymentLinkUrl
                            console.log(`[POD] Payment link generated for booking ${booking.bookingNumber}`)
                        } else {
                            console.error('[POD] Failed to generate payment link:', linkRes.error)
                        }
                    } catch (linkError) {
                        console.error('[POD] Payment link generation error:', linkError)
                    }
                }

                try {
                    await sendNotification({
                        userId: booking.userId,
                        title: 'Service Started',
                        body: `${provider.user?.name || 'Provider'} has started your service for booking #${booking.bookingNumber}. ${(paymentMethod === 'POD' || paymentMethod === 'COD') ? 'Please complete the payment using the link sent to you.' : ''}`,
                        type: 'SERVICE_STARTED',
                        referenceId: booking.id,
                    })
                } catch (notifError) {
                    console.error('Notification error:', notifError)
                }
                break

            case 'complete':
                // ✅ Block completion for POD/COD if payment not yet confirmed via webhook
                if ((paymentMethod === 'POD' || paymentMethod === 'COD') && booking.paymentStatus !== 'PAID') {
                    return NextResponse.json({
                        success: false,
                        error: 'Payment not received yet. Please wait for customer to complete payment via the link before closing this job.'
                    }, { status: 400 })
                }

                newStatus = 'SERVICE_COMPLETED'
                updateData.completedAt = new Date()
                if (photos) updateData.afterPhotos = photos

                // ═══════════════════════════════
                // FINANCIAL SETTLEMENT LOGIC
                // ═══════════════════════════════
                
                // Determine if this is Physical Cash (needs OPS verification) or Online/Razorpay Link (auto-settle)
                const isPhysicalCashPod = (paymentMethod === 'POD' || paymentMethod === 'COD') && !isRazorpayPod;
                
                // Calculate final amounts (adjust proportionally if COD amount differs from total)
                let finalTotal = booking.totalAmount;
                let ratio = 1;
                
                if (isPhysicalCashPod) {
                    finalTotal = codAmountCollected || booking.totalAmount;
                    updateData.codAmountCollected = finalTotal;
                    ratio = finalTotal / booking.totalAmount;
                }

                const adjBase = booking.baseAmount * ratio;
                const adjComm = booking.companyCommission * ratio;
                const adjEarn = booking.providerEarningAmt * ratio;
                const adjGst = (booking.cgstAmount + booking.sgstAmount) * ratio;

                // 1. Create/Update Provider Earning Record
                const earningStatus = isPhysicalCashPod ? 'PENDING_VERIFICATION' : 'SETTLED';
                
                await db.providerEarning.create({
                    data: {
                        providerId: provider.id, 
                        bookingId: booking.id,
                        gross: adjBase, 
                        commission: adjComm, 
                        net: adjEarn,
                        status: earningStatus, 
                        paymentMethod: paymentMethod,
                        collectedAmount: isPhysicalCashPod ? finalTotal : null,
                        collectedAt: isPhysicalCashPod ? new Date() : null,
                        settledAt: !isPhysicalCashPod ? new Date() : null,
                    }
                });

                // 2. Update Provider Stats
                await db.provider.update({
                    where: { id: provider.id },
                    data: {
                        totalJobs: { increment: 1 },
                        currentWorkStatus: 'AVAILABLE', 
                        currentJobId: null
                    }
                });

                // 3. If Online or Razorpay Link POD -> Auto-settle to Wallet & Ledger
                if (!isPhysicalCashPod) {
                    await db.$transaction(async (tx) => {
                        // Credit Provider Wallet
                        const updatedProvider = await tx.provider.update({
                            where: { id: provider.id },
                            data: { walletBalance: { increment: adjEarn } }
                        });

                        // Create Wallet Transaction
                        const walletTxn = await tx.providerWalletTransaction.create({
                            data: {
                                providerId: provider.id,
                                type: 'EARNING_CREDIT',
                                amount: adjEarn,
                                balanceAfter: updatedProvider.walletBalance,
                                description: `Earning from booking #${booking.bookingNumber}`,
                                bookingId: booking.id,
                            }
                        });

                        // Link Wallet Txn to Earning
                        await tx.providerEarning.update({
                            where: { bookingId: booking.id },
                            data: { walletTxnId: walletTxn.id }
                        });

                        // Create Company Ledger Entries
                        await tx.companyLedger.createMany({
                            data: [
                                { 
                                    type: 'COMMISSION_CREDIT', 
                                    amount: adjComm, 
                                    description: `Commission from booking #${booking.bookingNumber}`, 
                                    bookingId: booking.id 
                                },
                                { 
                                    type: 'GST_COLLECTED', 
                                    amount: adjGst, 
                                    description: `GST from booking #${booking.bookingNumber}`, 
                                    bookingId: booking.id 
                                }
                            ]
                        });
                    });
                }

                try {
                    await sendNotification({
                        userId: booking.userId,
                        title: 'Service Completed',
                        body: `Your service for booking #${booking.bookingNumber} has been completed. Thank you!`,
                        type: 'SERVICE_COMPLETED', referenceId: booking.id,
                    })
                } catch (notifError) { console.error('Notification error:', notifError) }
                break

            case 'on_the_way':
                newStatus = 'PROVIDER_TRAVELLING'
                await db.provider.update({
                    where: { id: provider.id },
                    data: { currentWorkStatus: 'ON_THE_WAY' }
                })
                try {
                    await sendNotification({
                        userId: booking.userId,
                        title: 'Provider On The Way',
                        body: `Your provider is on the way for booking #${booking.bookingNumber}`,
                        type: 'PROVIDER_TRAVELLING', referenceId: booking.id,
                    })
                } catch (notifError) { console.error('Notification error:', notifError) }
                break

            default:
                return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
        }

        const updatedBooking = await db.booking.update({
            where: { id },
            data: { status: newStatus, ...updateData }
        })

        await db.bookingStatusHistory.create({
            data: {
                bookingId: id, status: newStatus,
                note: `Action: ${action} by provider${action === 'complete' && (paymentMethod === 'POD' || paymentMethod === 'COD') ? ` (${paymentMethod}: ₹${codAmountCollected || booking.totalAmount})` : ''}`,
                changedBy: providerAuth.userId
            }
        })

        return NextResponse.json({
            success: true,
            data: updatedBooking,
            message: action === 'complete' && (paymentMethod === 'POD' || paymentMethod === 'COD') && !isRazorpayPod
                ? 'Service completed. Physical cash POD amount pending OPS verification.'
                : `Job ${action}ed successfully!`
        })
    } catch (error) {
        console.error('Provider Job Status Error:', error)
        return NextResponse.json({ success: false, error: 'Failed to update job status' }, { status: 500 })
    }
}