/**
 * WHAT: Provider status update karega (travelling, started, completed)
 * WHY: Real-time tracking ke liye status updates zaroori hain
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
        const { status, note } = body

        // Valid status transitions
        const validStatuses = ['PROVIDER_TRAVELLING', 'SERVICE_STARTED', 'SERVICE_COMPLETED']
        if (!validStatuses.includes(status)) {
            return NextResponse.json({ success: false, error: 'Invalid status' }, { status: 400 })
        }

        // Fetch booking
        const booking = await db.booking.findUnique({
            where: { id },
            include: {
                user: { select: { id: true, name: true, phone: true } },
                service: { select: { name: true } },
                provider: {
                    include: {
                        user: { select: { id: true, name: true } }
                    }
                }
            }
        })

        if (!booking) {
            return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 })
        }

        // Validate status transition
        const currentStatus = booking.status
        const validTransitions: Record<string, string[]> = {
            'CONFIRMED': ['PROVIDER_TRAVELLING'],
            'PROVIDER_ASSIGNED': ['PROVIDER_TRAVELLING'],
            'PROVIDER_TRAVELLING': ['SERVICE_STARTED'],
            'SERVICE_STARTED': ['SERVICE_COMPLETED'],
        }

        if (!validTransitions[currentStatus]?.includes(status)) {
            return NextResponse.json({
                success: false,
                error: `Cannot transition from ${currentStatus} to ${status}`
            }, { status: 400 })
        }

        // Update booking
        const updateData: Record<string, any> = { status }

        if (status === 'SERVICE_COMPLETED') {
            updateData.completedAt = new Date()
        }
        if (status === 'SERVICE_STARTED') {
            updateData.startedAt = new Date()
        }

        await db.booking.update({ where: { id }, data: updateData })

        // ✅ NEW: Update Provider's Real-time Work Status
        if (booking.providerId) {
            let workStatus = 'AVAILABLE'
            if (status === 'PROVIDER_TRAVELLING') workStatus = 'ON_THE_WAY'
            if (status === 'SERVICE_STARTED') workStatus = 'WORKING'
            if (status === 'SERVICE_COMPLETED') workStatus = 'AVAILABLE'

            await db.provider.update({
                where: { id: booking.providerId },
                data: { 
                    currentWorkStatus: workStatus as any,
                    currentJobId: status === 'SERVICE_COMPLETED' ? null : booking.id 
                }
            })
        }

        // ✅ NEW: If POD and Service Started, Generate Payment Link
        if (status === 'SERVICE_STARTED' && (booking.paymentMethod === 'POD' || booking.paymentMethod === 'COD')) {
            try {
                // Yahan aap Razorpay payment link create kar sakte ho
                // const link = await createPaymentLink(booking.totalAmount, booking.user.phone)
                // await db.booking.update({ where: { id }, data: { razorpayPaymentLinkUrl: link } })
                console.log('🔗 POD Payment Link generation triggered for booking:', id)
            } catch (e) {
                console.error('Payment link generation failed:', e)
            }
        }

        // Create status history
        await db.bookingStatusHistory.create({
            data: {
                bookingId: id,
                status,
                note: note || `Status updated to ${status}`,
                changedBy: payload.userId
            }
        })

        // Send notification to customer
        try {
            let customerMessage = ''
            let notificationTitle = ''

            switch (status) {
                case 'PROVIDER_TRAVELLING':
                    notificationTitle = 'Provider On Way'
                    customerMessage = `Your provider ${booking.provider?.user.name} is on the way to your location for booking #${booking.bookingNumber}.`
                    break
                case 'SERVICE_STARTED':
                    notificationTitle = 'Service Started'
                    customerMessage = `Service has started for booking #${booking.bookingNumber}.`
                    break
                case 'SERVICE_COMPLETED':
                    notificationTitle = 'Service Completed'
                    customerMessage = `Service completed for booking #${booking.bookingNumber}. Thank you for choosing us!`
                    break
            }

            await sendNotification({
                userId: booking.userId,
                title: notificationTitle,
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

        return NextResponse.json({
            success: true,
            message: 'Status updated successfully',
            data: {
                status,
                bookingNumber: booking.bookingNumber,
            }
        })
    } catch (error) {
        console.error('Status Update Error:', error)
        return NextResponse.json({ success: false, error: 'Failed to update status' }, { status: 500 })
    }
}