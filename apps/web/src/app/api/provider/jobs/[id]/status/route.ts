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
            include: {
                user: { select: { name: true } }
            }
        })
        if (!provider) return NextResponse.json({ success: false, error: 'Provider not found' }, { status: 404 })

        const { id } = await params
        const body = await request.json()
        const { action, photos, codAmountCollected } = body

        const booking = await db.booking.findUnique({ 
            where: { id },
            include: {
                user: { select: { id: true, name: true, phone: true } },
                service: { 
                    select: { 
                        name: true,
                        subCategory: {
                            include: {
                                category: true
                            }
                        }
                    }
                },
            }
        })
        if (!booking) return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 })

        // Fetch admin settings for commission calculation
        const settings = await getAdminSettings()

        let newStatus = booking.status
        let updateData: any = {}
        
        // Define paymentMethod at function scope
        const paymentMethod = booking.paymentMethod || 'ONLINE'

        switch (action) {
            case 'accept':
                newStatus = 'CONFIRMED'
                await db.provider.update({
                    where: { id: provider.id },
                    data: { currentWorkStatus: 'AVAILABLE' }
                })
                break

            case 'reject':
                newStatus = 'CANCELLED_BY_PROVIDER'
                updateData.cancelledAt = new Date()
                updateData.cancelReason = body.reason || 'Rejected by provider'
                await db.provider.update({
                    where: { id: provider.id },
                    data: { 
                        currentWorkStatus: 'AVAILABLE',
                        currentJobId: null
                    }
                })
                break

            case 'start':
                newStatus = 'SERVICE_STARTED'
                updateData.startedAt = new Date()
                await db.provider.update({
                    where: { id: provider.id },
                    data: { currentWorkStatus: 'WORKING' }
                })
                try {
                    await sendNotification({
                        userId: booking.userId,
                        title: 'Service Started',
                        body: `${provider.user?.name || 'Provider'} has started your service for booking #${booking.bookingNumber}`,
                        type: 'SERVICE_STARTED',
                        referenceId: booking.id,
                    })
                } catch (notifError) {
                    console.error('Notification error:', notifError)
                }
                break

            case 'complete':
                newStatus = 'SERVICE_COMPLETED'
                updateData.completedAt = new Date()
                if (photos) updateData.afterPhotos = photos

                // ═══════════════════════════════
                // EARNING CALCULATION (ENHANCED)
                // ═══════════════════════════════
                
                if (paymentMethod === 'POD' || paymentMethod === 'COD') {
                    // POD/COD: Provider confirms collection, OPS verifies later
                    const collectedAmount = codAmountCollected || booking.totalAmount
                    updateData.codAmountCollected = collectedAmount
                    
                    // Calculate commission using admin settings
                    const { commission, net } = calculateCommission(
                        collectedAmount,
                        provider.commissionRate,
                        settings
                    )
                    
                    // Create earning with PENDING_VERIFICATION status
                    await db.providerEarning.create({
                        data: {
                            providerId: provider.id,
                            bookingId: booking.id,
                            gross: collectedAmount,
                            commission,
                            net,
                            status: 'PENDING_VERIFICATION',
                            paymentMethod: 'POD', // Track as POD
                            collectedAmount: collectedAmount,
                            collectedAt: new Date(),
                        }
                    })
                } else {
                    // ONLINE: Payment already received, earning auto-settled
                    const { commission, net } = calculateCommission(
                        booking.totalAmount,
                        provider.commissionRate,
                        settings
                    )
                    
                    // Create earning with SETTLED status (auto-settled for online)
                    await db.providerEarning.create({
                        data: {
                            providerId: provider.id,
                            bookingId: booking.id,
                            gross: booking.totalAmount,
                            commission,
                            net,
                            status: 'SETTLED',
                            paymentMethod: 'ONLINE', // Track as ONLINE
                            settledAt: new Date(),
                        }
                    })

                    // Update payment status
                    await db.payment.updateMany({
                        where: { bookingId: booking.id },
                        data: { status: 'PAID' }
                    })
                }

                // Update provider stats
                await db.provider.update({
                    where: { id: provider.id },
                    data: {
                        totalJobs: { increment: 1 },
                        totalEarnings: { increment: paymentMethod === 'POD' || paymentMethod === 'COD' 
                            ? (codAmountCollected || booking.totalAmount) - calculateCommission(codAmountCollected || booking.totalAmount, provider.commissionRate, settings).commission
                            : booking.totalAmount - calculateCommission(booking.totalAmount, provider.commissionRate, settings).commission
                        },
                        currentWorkStatus: 'AVAILABLE',
                        currentJobId: null
                    }
                })

                try {
                    await sendNotification({
                        userId: booking.userId,
                        title: 'Service Completed',
                        body: `Your service for booking #${booking.bookingNumber} has been completed. Thank you!`,
                        type: 'SERVICE_COMPLETED',
                        referenceId: booking.id,
                    })
                } catch (notifError) {
                    console.error('Notification error:', notifError)
                }
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
                        type: 'PROVIDER_TRAVELLING',
                        referenceId: booking.id,
                    })
                } catch (notifError) {
                    console.error('Notification error:', notifError)
                }
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
                bookingId: id,
                status: newStatus,
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