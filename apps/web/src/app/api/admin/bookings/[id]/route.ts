import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminUser } from '@/lib/auth'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const admin = await getAdminUser(request)
        if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

        const { id } = await params
        const booking = await db.booking.findUnique({
            where: { id },
            include: {
                user: { select: { name: true, phone: true, email: true } },
                service: true,
                provider: { include: { user: { select: { name: true, phone: true } } } },
                address: true,
                payment: true,
                review: true,
                statusHistory: { orderBy: { createdAt: 'desc' } }
            }
        })

        if (!booking) return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 })
        return NextResponse.json({ success: true, data: booking })
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed to fetch booking' }, { status: 500 })
    }
}