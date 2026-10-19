/**
 * WHAT: Assign provider with work status check
 * WHY: 
 * - Check provider.currentWorkStatus before assigning
 * - If WORKING/ON_THE_WAY → Return warning (but still allow assignment)
 * - Update provider.currentJobId and currentWorkStatus
 * NOTE: OPS can override warning if needed
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCallingTeamUser } from '@/lib/auth'
import { sendProviderAssigned } from '@/lib/notifications'

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
        const { providerId, notes } = body

        if (!providerId) {
            return NextResponse.json(
                { success: false, error: 'Provider ID is required' },
                { status: 400 }
            )
        }

        // Verify booking exists
        const booking = await db.booking.findUnique({
            where: { id: bookingId },
            include: {
                service: { include: { subCategory: true } },
                provider: { include: { user: { select: { name: true } } } },
                user: { select: { name: true, phone: true } },
            }
        })

        if (!booking) {
            return NextResponse.json(
                { success: false, error: 'Booking not found' },
                { status: 404 }
            )
        }

        // Verify provider exists
        const provider = await db.provider.findUnique({
            where: { id: providerId },
        })

        if (!provider) {
            return NextResponse.json(
                { success: false, error: 'Provider not found' },
                { status: 404 }
            )
        }

        if (provider.status !== 'APPROVED') {
            return NextResponse.json(
                { success: false, error: 'Provider is not approved' },
                { status: 400 }
            )
        }


         // ✅ NEW: Check if booking is confirmed before assigning
        const validStatusesForAssign = ['CONFIRMED', 'PROVIDER_ASSIGNED', 'PROVIDER_TRAVELLING']
        if (!validStatusesForAssign.includes(booking.status)) {
            return NextResponse.json(
                { success: false, error: 'Please confirm the booking first before assigning a provider.' },
                { status: 400 }
            )
        }

        // ═══════════════════════════════════════════════════════════════
        // NEW: Check provider work status
        // ═══════════════════════════════════════════════════════════════
        const providerWorkStatus = provider.currentWorkStatus || 'AVAILABLE'
        let warning = null

        if (providerWorkStatus === 'WORKING') {
            warning = `Provider is currently working on another job (ID: ${provider.currentJobId}). Assignment may be delayed.`
        } else if (providerWorkStatus === 'ON_THE_WAY') {
            warning = `Provider is on the way to another job. Assignment may be delayed.`
        }

        const providerUser = await db.user.findUnique({
            where: { id: provider.userId },
            select: { name: true, phone: true }
        })

        const oldProviderName = booking.provider?.user?.name || 'None'
        const newProviderName = providerUser?.name || 'Unknown'

        // ═══════════════════════════════════════════════════════════════
        // Update booking + provider status + create logs
        // ═══════════════════════════════════════════════════════════════
        const [updatedBooking] = await db.$transaction([
            // Update booking
            db.booking.update({
                where: { id: bookingId },
                data: {
                    providerId,
                    status: 'PROVIDER_ASSIGNED',
                },
                include: {
                    user: { select: { name: true, phone: true } },
                    provider: { include: { user: { select: { name: true, phone: true } } } },
                    service: { select: { name: true } },
                }
            }),

            // NEW: Update provider work status
            db.provider.update({
                where: { id: providerId },
                data: {
                    currentJobId: bookingId,
                    currentWorkStatus: 'AVAILABLE', // Will be updated when provider starts
                },
            }),

            // Create activity log
            db.bookingAssignmentLog.create({
                data: {
                    bookingId,
                    actionBy: user.userId,
                    action: 'PROVIDER_ASSIGNED',
                    fromValue: oldProviderName,
                    toValue: newProviderName,
                    notes: notes || null,
                }
            }),

            // Create status history
            db.bookingStatusHistory.create({
                data: {
                    bookingId,
                    status: 'PROVIDER_ASSIGNED',
                    note: `Provider assigned: ${newProviderName}${notes ? ` (${notes})` : ''}`,
                    changedBy: user.userId,
                }
            }),
        ])

        // ═══════════════════════════════════════════════════════════════
        // NEW: Send notification to customer
        // ═══════════════════════════════════════════════════════════════
        try {
            await sendProviderAssigned(
                booking.userId,
                booking.user.phone,
                booking.bookingNumber,
                newProviderName,
                providerUser?.phone || ''
            )
        } catch (notifError) {
            console.error('Notification error:', notifError)
        }

        return NextResponse.json({
            success: true,
            message: `Provider ${newProviderName} assigned successfully`,
            data: updatedBooking,
            warning, // NEW: Return warning if provider is busy
        })

    } catch (error) {
        console.error('❌ Ops assign provider error:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}