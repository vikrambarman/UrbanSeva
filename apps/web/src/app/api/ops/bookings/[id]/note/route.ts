// apps/web/src/app/api/ops/bookings/[id]/note/route.ts
// KYA: Internal note add karne ka API endpoint
// KYUN: Ops team booking pe internal notes add kar sake team coordination ke liye
//       Notes activity log mein dikhenge (BookingAssignmentLog mein NOTE_ADDED action)

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
        const { note } = body

        if (!note || !note.trim()) {
            return NextResponse.json(
                { success: false, error: 'Note cannot be empty' },
                { status: 400 }
            )
        }

        // Verify booking exists
        const booking = await db.booking.findUnique({
            where: { id: bookingId },
            include: {
                user: { select: { name: true, phone: true } },
                service: { select: { name: true } },
            }
        })

        if (!booking) {
            return NextResponse.json(
                { success: false, error: 'Booking not found' },
                { status: 404 }
            )
        }

        // Create activity log entry for the note
        await db.bookingAssignmentLog.create({
            data: {
                bookingId,
                actionBy: user.userId,
                action: 'NOTE_ADDED',
                notes: note.trim(),
            }
        })

        return NextResponse.json({
            success: true,
            message: 'Note added successfully',
        })

    } catch (error) {
        console.error('❌ Ops add note error:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}