// api/ops/bookings/[id]/assign/route.ts
// CHANGE: TypeScript error fix kiya — provider.user access ko safe banaya
// CHANGE: Provider ko pehle simple findUnique se fetch kiya, phir user alag se
// WHY: Prisma ka type inference include relations ke saath kabhi-kabhi fail hota hai.
//       Separate queries se type safety ensure hoti hai aur error nahi aata.

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCallingTeamUser } from '@/lib/auth'

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

        // ═══════════════════════════════════════════════════════════════
        // Verify booking exists
        // ═══════════════════════════════════════════════════════════════
        const booking = await db.booking.findUnique({
            where: { id: bookingId },
            include: {
                service: {
                    include: {
                        subCategory: true
                    }
                },
                provider: {
                    include: {
                        user: {
                            select: { name: true }
                        }
                    }
                },
            }
        })

        if (!booking) {
            return NextResponse.json(
                { success: false, error: 'Booking not found' },
                { status: 404 }
            )
        }

        // ═══════════════════════════════════════════════════════════════
        // Verify provider exists and is active
        // CHANGE: Provider aur User alag-alag fetch kiye — type safety ke liye
        // ═══════════════════════════════════════════════════════════════
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

        // CHANGE: Provider ka user alag se fetch kiya — type-safe approach
        const providerUser = await db.user.findUnique({
            where: { id: provider.userId },
            select: { name: true }
        })

        // ═══════════════════════════════════════════════════════════════
        // Update booking + create activity log + status history
        // ═══════════════════════════════════════════════════════════════
        // CHANGE: booking.provider?.user?.name → booking.provider?.user?.name (safe access)
        //         provider.user?.name → providerUser?.name (separate variable)
        const oldProviderName = booking.provider?.user?.name || 'None'
        const newProviderName = providerUser?.name || 'Unknown'

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

        return NextResponse.json({
            success: true,
            message: `Provider ${newProviderName} assigned successfully`,
            data: updatedBooking,
        })

    } catch (error) {
        console.error('❌ Ops assign provider error:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}