/**
 * WHAT: OPS booking confirm karega aur provider assign karega
 * WHY: Booking lifecycle me confirmation step zaroori hai
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { sendNotification, sendSMS } from '@/lib/notifications'

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authHeader = request.headers.get('authorization')
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        const token = authHeader.substring(7)
        const payload = verifyToken(token)
        if (!payload) {
            return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 })
        }

        const { id } = await params
        const body = await request.json()
        const { providerId, note } = body

        // Fetch booking
        const booking = await db.booking.findUnique({
            where: { id },
            include: {
                user: { select: { id: true, name: true, phone: true } },
                service: { select: { name: true } },
                provider: {
                    include: {
                        user: { select: { name: true, phone: true } }
                    }
                }
            }
        })

        if (!booking) {
            return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 })
        }

        // Check if already confirmed or cancelled
        if (['CONFIRMED', 'PROVIDER_ASSIGNED', 'PROVIDER_TRAVELLING', 'SERVICE_STARTED', 'SERVICE_COMPLETED'].includes(booking.status)) {
            return NextResponse.json({ success: false, error: 'Booking already confirmed or in progress' }, { status: 400 })
        }

        if (['CANCELLED_BY_CUSTOMER', 'CANCELLED_BY_OPS', 'CANCELLED_BY_PROVIDER'].includes(booking.status)) {
            return NextResponse.json({ success: false, error: 'Booking is cancelled' }, { status: 400 })
        }

        // Validate provider if provided
        let provider = null
        if (providerId) {
            provider = await db.provider.findUnique({
                where: { id: providerId },
                include: { user: { select: { name: true, phone: true } } }
            })

            if (!provider) {
                return NextResponse.json({ success: false, error: 'Provider not found' }, { status: 404 })
            }

            // ✅ FIX: Provider model mein 'isActive' nahi hai, 'status' aur 'isAvailable' hai
            if (provider.status !== 'APPROVED') {
                return NextResponse.json({ success: false, error: 'Provider is not approved yet' }, { status: 400 })
            }
            if (!provider.isAvailable) {
                return NextResponse.json({ success: false, error: 'Provider is currently offline/unavailable' }, { status: 400 })
            }
        }

        // Determine new status
        const newStatus = providerId ? 'PROVIDER_ASSIGNED' : 'CONFIRMED'

        // Update booking
        await db.booking.update({
            where: { id },
            data: {
                status: newStatus,
                providerId: providerId || null,
                // ✅ FIX: 'confirmedAt' Prisma schema mein nahi hai, isko remove kar diya
            }
        })

        // ✅ NEW: Update Provider's current job ID
        if (providerId) {
            await db.provider.update({
                where: { id: providerId },
                data: { currentJobId: id }
            })
        }


        // Create status history
        await db.bookingStatusHistory.create({
            data: {
                bookingId: id,
                status: newStatus,
                note: providerId
                    ? `Booking confirmed by OPS. Provider assigned: ${provider?.user.name}. ${note || ''}`
                    : `Booking confirmed by OPS. ${note || ''}`,
                changedBy: payload.userId
            }
        })

        // Send notifications to customer
        try {
            const customerMessage = providerId
                ? `Your booking #${booking.bookingNumber} is confirmed. Provider ${provider?.user.name} will arrive at the scheduled time.`
                : `Your booking #${booking.bookingNumber} is confirmed. Provider will be assigned soon.`

            await sendNotification({
                userId: booking.userId,
                title: 'Booking Confirmed',
                body: customerMessage,
                type: 'GENERAL',
                referenceId: booking.id,
            })

            if (booking.user.phone) {
                await sendSMS({
                    phone: booking.user.phone,
                    message: `${customerMessage} - HomeServices`,
                    type: 'GENERAL',
                })
            }
        } catch (notifError) {
            console.error('Notification error:', notifError)
        }

        // Notify provider if assigned
        if (providerId && provider) {
            try {
                await sendNotification({
                    userId: provider.userId,
                    title: 'New Booking Assigned',
                    body: `You have been assigned booking #${booking.bookingNumber} for ${booking.service.name}.`,
                    type: 'GENERAL',
                    referenceId: booking.id,
                })

                if (provider.user.phone) {
                    await sendSMS({
                        phone: provider.user.phone,
                        message: `New booking #${booking.bookingNumber} assigned. Service: ${booking.service.name}. Date: ${new Date(booking.scheduledDate).toLocaleDateString('en-IN')}. - HomeServices`,
                        type: 'GENERAL',
                    })
                }
            } catch (notifError) {
                console.error('Provider notification error:', notifError)
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Booking confirmed successfully',
            data: {
                status: newStatus,
                providerId: providerId || null,
                providerName: provider?.user.name || null,
            }
        })
    } catch (error) {
        console.error('Confirm Booking Error:', error)
        return NextResponse.json({ success: false, error: 'Failed to confirm booking' }, { status: 500 })
    }
}