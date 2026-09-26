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
        const provider = await db.provider.findUnique({
            where: { id },
            include: {
                user: true,
                services: {
                    include: { service: { select: { name: true, image: true } } }
                },
                earnings: { take: 10, orderBy: { createdAt: 'desc' } },
                payouts: { take: 10, orderBy: { createdAt: 'desc' } }
            }
        })

        if (!provider) return NextResponse.json({ success: false, error: 'Provider not found' }, { status: 404 })
        return NextResponse.json({ success: true, data: provider })
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed to fetch provider' }, { status: 500 })
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const admin = await getAdminUser(request)
        if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

        const { id } = await params
        const body = await request.json()

        // Only allow updating specific fields like commissionRate
        const updatedProvider = await db.provider.update({
            where: { id },
            data: {
                commissionRate: body.commissionRate,
                isAvailable: body.isAvailable,
            }
        })

        return NextResponse.json({ success: true, data: updatedProvider })
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed to update provider' }, { status: 500 })
    }
}