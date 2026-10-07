/**
 * WHAT: Provider job status update with COD payment handling (FIXED)
 * WHY: 
 * - Fixed provider.user access (include user relation)
 * - Fixed paymentMethod variable scope
 * - ONLINE: Payment already received, earning auto-created
 * - COD: Provider confirms collection, OPS verifies later
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getProviderUser } from '@/lib/auth'
import { sendNotification } from '@/lib/notifications'

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
                user: { select: { name: true } } // FIX: Include user relation
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
                service: { select: { name: true } },
            }
        })
        if (!booking) return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 })

        let newStatus = booking.status
        let updateData: any = {}
        
        // FIX: Define paymentMethod at function scope
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

                if (paymentMethod === 'COD') {
                    const collectedAmount = codAmountCollected || booking.totalAmount
                    updateData.codAmountCollected = collectedAmount
                    
                    const commission = collectedAmount * (provider.commissionRate / 100)
                    const net = collectedAmount - commission
                    
                    await db.providerEarning.create({
                        data: {
                            providerId: provider.id,
                            bookingId: booking.id,
                            gross: collectedAmount,
                            commission,
                            net,
                            status: 'PENDING_VERIFICATION'
                        }
                    })
                } else {
                    const commission = booking.totalAmount * (provider.commissionRate / 100)
                    const net = booking.totalAmount - commission
                    
                    await db.providerEarning.create({
                        data: {
                            providerId: provider.id,
                            bookingId: booking.id,
                            gross: booking.totalAmount,
                            commission,
                            net,
                            status: 'SETTLED'
                        }
                    })

                    await db.payment.updateMany({
                        where: { bookingId: booking.id },
                        data: { status: 'PAID' }
                    })
                }

                await db.provider.update({
                    where: { id: provider.id },
                    data: {
                        totalJobs: { increment: 1 },
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
                // FIX: Use paymentMethod from outer scope
                note: `Action: ${action} by provider${action === 'complete' && paymentMethod === 'COD' ? ` (COD: ₹${codAmountCollected || booking.totalAmount})` : ''}`,
                changedBy: providerAuth.userId
            }
        })

        return NextResponse.json({ 
            success: true, 
            data: updatedBooking,
            // FIX: Use paymentMethod from outer scope
            message: action === 'complete' && paymentMethod === 'COD' 
                ? 'Service completed. COD amount pending OPS verification.' 
                : `Job ${action}ed successfully!`
        })
    } catch (error) {
        console.error('Provider Job Status Error:', error)
        return NextResponse.json({ success: false, error: 'Failed to update job status' }, { status: 500 })
    }
}