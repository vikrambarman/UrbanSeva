import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminUser } from '@/lib/auth'

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const admin = await getAdminUser(request)
        if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

        const { id } = await params
        const body = await request.json()

        if (!body.providerId) {
            return NextResponse.json({ success: false, error: 'Provider ID is required' }, { status: 400 })
        }

        const booking = await db.booking.update({
            where: { id },
            data: { providerId: body.providerId, status: 'PROVIDER_ASSIGNED' }
        })

        await db.bookingStatusHistory.create({
            data: {
                bookingId: id,
                status: 'PROVIDER_ASSIGNED',
                note: `Provider assigned by Admin`,
                changedBy: admin.userId
            }
        })

        return NextResponse.json({ success: true, data: booking })
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed to assign provider' }, { status: 500 })
    }
}