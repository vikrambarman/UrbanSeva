/**
 * WHAT: Provider job status update with POD/Online payment handling
 * WHY: 
 * - POD earnings alag track honge (paymentMethod: 'POD')
 * - Online earnings auto-settle honge (paymentMethod: 'ONLINE')
 * - Commission calculation admin settings se aayega (percentage/fixed)
 * - GST breakdown accounting ke liye save hoga
 * NOTE: Provider "Collect Payment" button dabayega POD ke liye (Phase 4 mein)
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getProviderUser } from '@/lib/auth'
import { sendNotification } from '@/lib/notifications'
import { cancelBookingWithRefund } from '@/lib/booking-helpers'

// Helper: Fetch admin settings
async function getAdminSettings() {
    const settings = await db.appSetting.findMany()
    const formatted = settings.reduce((acc, curr) => {
        acc[curr.key] = curr.value
        return acc
    }, {} as Record<string, string>)
    return formatted
}

// Helper: Calculate commission based on admin settings
function calculateCommission(
    baseAmount: number,
    providerCommissionRate: number,
    settings: Record<string, string>
): { commission: number; net: number } {
    const commissionType = settings.COMMISSION_TYPE || 'PERCENTAGE'
    const defaultCommission = parseFloat(settings.DEFAULT_COMMISSION || '20')

    // Use provider-specific rate if set, otherwise use default
    const rate = providerCommissionRate > 0 ? providerCommissionRate : defaultCommission

    let commission: number

    if (commissionType === 'FIXED') {
        // Fixed amount commission
        commission = rate
    } else {
        // Percentage commission
        commission = baseAmount * (rate / 100)
    }

    const net = baseAmount - commission

    return { commission, net }
}

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
                // ✅ FIX: Added email to user select for Payment Link generation
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

        const settings = await getAdminSettings()
        let newStatus = booking.status
        let updateData: any = {}
        const paymentMethod = booking.paymentMethod || 'ONLINE'

        switch (action) {
            case 'accept':
                newStatus = 'CONFIRMED'
                await db.provider.update({
                    where: { id: provider.id },
                    data: { currentWorkStatus: 'AVAILABLE' }
                })
                break

            case 'reject': {
                // ✅ FIX: Use shared cancellation+refund logic instead of just updating status
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

                // ✅ Early return since cancelBookingWithRefund already updated booking + history
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

                // 🚀 POD: Auto-generate Payment Link when service starts
                if (paymentMethod === 'POD' || paymentMethod === 'COD') {
                    try {
                        const { createPaymentLink } = await import('@/lib/razorpay')
                        const linkRes = await createPaymentLink(
                            booking.totalAmount,
                            'INR',
                            booking.user.phone,
                            booking.user.name || 'Customer',   // ✅ FIX: null fallback
                            booking.bookingNumber,
                            booking.user.email || undefined
                        )

                        if (linkRes.success) {
                            updateData.razorpayPaymentLinkId = linkRes.paymentLinkId
                            updateData.razorpayPaymentLinkUrl = linkRes.paymentLinkUrl
                            console.log(`[POD] Payment link generated for booking ${booking.bookingNumber}: ${linkRes.paymentLinkUrl}`)

                            // Note: Razorpay auto-sends SMS/Email. 
                            // TODO: Integrate MSG91/Fast2SMS for custom WhatsApp/SMS when DLT is ready.
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
                        body: `${provider.user?.name || 'Provider'} has started your service for booking #${booking.bookingNumber}. ${paymentMethod === 'POD' || paymentMethod === 'COD' ? 'Please complete the payment using the link sent to you.' : ''}`,
                        type: 'SERVICE_STARTED',
                        referenceId: booking.id,
                    })
                } catch (notifError) {
                    console.error('Notification error:', notifError)
                }
                break

            case 'complete':
                // ✅ NEW: Block completion for POD/COD if payment not yet confirmed via webhook
                if ((paymentMethod === 'POD' || paymentMethod === 'COD') && booking.paymentStatus !== 'PAID') {
                    return NextResponse.json({
                        success: false,
                        error: 'Payment not received yet. Please wait for customer to complete payment via the link before closing this job.'
                    }, { status: 400 })
                }

                newStatus = 'SERVICE_COMPLETED'
                updateData.completedAt = new Date()
                if (photos) updateData.afterPhotos = photos

                if (paymentMethod === 'POD' || paymentMethod === 'COD') {
                    const collectedAmount = codAmountCollected || booking.totalAmount
                    updateData.codAmountCollected = collectedAmount
                    const { commission, net } = calculateCommission(collectedAmount, provider.commissionRate, settings)

                    await db.providerEarning.create({
                        data: {
                            providerId: provider.id, bookingId: booking.id,
                            gross: collectedAmount, commission, net,
                            status: 'PENDING_VERIFICATION', paymentMethod: 'POD',
                            collectedAmount: collectedAmount, collectedAt: new Date(),
                        }
                    })
                } else {
                    const { commission, net } = calculateCommission(booking.totalAmount, provider.commissionRate, settings)
                    await db.providerEarning.create({
                        data: {
                            providerId: provider.id, bookingId: booking.id,
                            gross: booking.totalAmount, commission, net,
                            status: 'SETTLED', paymentMethod: 'ONLINE', settledAt: new Date(),
                        }
                    })
                    await db.payment.updateMany({ where: { bookingId: booking.id }, data: { status: 'PAID' } })
                }

                await db.provider.update({
                    where: { id: provider.id },
                    data: {
                        totalJobs: { increment: 1 },
                        totalEarnings: {
                            increment: paymentMethod === 'POD' || paymentMethod === 'COD'
                                ? (codAmountCollected || booking.totalAmount) - calculateCommission(codAmountCollected || booking.totalAmount, provider.commissionRate, settings).commission
                                : booking.totalAmount - calculateCommission(booking.totalAmount, provider.commissionRate, settings).commission
                        },
                        currentWorkStatus: 'AVAILABLE', currentJobId: null
                    }
                })

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
            message: action === 'complete' && (paymentMethod === 'POD' || paymentMethod === 'COD')
                ? 'Service completed. POD amount pending OPS verification.'
                : `Job ${action}ed successfully!`
        })
    } catch (error) {
        console.error('Provider Job Status Error:', error)
        return NextResponse.json({ success: false, error: 'Failed to update job status' }, { status: 500 })
    }
}