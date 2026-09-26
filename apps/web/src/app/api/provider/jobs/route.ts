import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getProviderUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
    try {
        const providerAuth = await getProviderUser(request)
        if (!providerAuth) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

        const provider = await db.provider.findUnique({ where: { userId: providerAuth.userId } })
        if (!provider) return NextResponse.json({ success: false, error: 'Provider not found' }, { status: 404 })

        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status') || 'ALL'

        const where: any = { providerId: provider.id }
        if (status !== 'ALL') where.status = status

        const bookings = await db.booking.findMany({
            where,
            orderBy: { scheduledDate: 'desc' },
            include: {
                user: { select: { name: true, phone: true } },
                service: { select: { name: true, image: true, duration: true } },
                address: { select: { fullAddress: true, area: true, landmark: true } },
                review: { select: { overallRating: true, comment: true } }
            }
        })

        return NextResponse.json({ success: true, data: bookings })
    } catch (error) {
        console.error('Provider Jobs GET Error:', error)
        return NextResponse.json({ success: false, error: 'Failed to fetch jobs' }, { status: 500 })
    }
}