import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getProviderUser } from '@/lib/auth'

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const providerAuth = await getProviderUser(request)
        if (!providerAuth) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

        const provider = await db.provider.findUnique({ where: { userId: providerAuth.userId } })
        if (!provider) return NextResponse.json({ success: false, error: 'Provider not found' }, { status: 404 })

        const { id } = await params
        const body = await request.json()
        const { action, photos } = body

        const booking = await db.booking.findUnique({ where: { id } })
        if (!booking) return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 })

        let newStatus = booking.status
        let updateData: any = {}

        switch (action) {
            case 'accept':
                newStatus = 'CONFIRMED'
                break
            case 'reject':
                newStatus = 'CANCELLED'
                updateData.cancelledAt = new Date()
                updateData.cancelReason = body.reason || 'Rejected by provider'
                break
            case 'start':
                newStatus = 'SERVICE_STARTED'
                updateData.startedAt = new Date()
                break
            case 'complete':
                newStatus = 'SERVICE_COMPLETED'
                updateData.completedAt = new Date()
                if (photos) updateData.afterPhotos = photos
                
                // Create provider earning
                const commission = booking.totalAmount * (provider.commissionRate / 100)
                const net = booking.totalAmount - commission
                
                await db.providerEarning.create({
                    data: {
                        providerId: provider.id,
                        bookingId: booking.id,
                        gross: booking.totalAmount,
                        commission,
                        net,
                        status: 'PENDING'
                    }
                })

                // Update provider stats
                await db.provider.update({
                    where: { id: provider.id },
                    data: {
                        totalJobs: { increment: 1 },
                        totalEarnings: { increment: net }
                    }
                })
                break
            default:
                return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
        }

        const updatedBooking = await db.booking.update({
            where: { id },
            data: { status: newStatus, ...updateData }
        })

        // Add to status history
        await db.bookingStatusHistory.create({
            data: {
                bookingId: id,
                status: newStatus,
                note: `Action: ${action} by provider`,
                changedBy: providerAuth.userId
            }
        })

        return NextResponse.json({ success: true, data: updatedBooking })
    } catch (error) {
        console.error('Provider Job Status Error:', error)
        return NextResponse.json({ success: false, error: 'Failed to update job status' }, { status: 500 })
    }
}