import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
    try {
        const admin = await getAdminUser(request)
        if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status')

        const where: any = {}
        if (status && status !== 'ALL') where.status = status

        const payouts = await db.payout.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                provider: { include: { user: { select: { name: true, phone: true } } } }
            }
        })

        return NextResponse.json({ success: true, data: payouts })
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed to fetch payouts' }, { status: 500 })
    }
}

// Process Payout (Mark as completed)
export async function POST(request: NextRequest) {
    try {
        const admin = await getAdminUser(request)
        if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

        const body = await request.json()
        const { payoutId } = body

        if (!payoutId) return NextResponse.json({ success: false, error: 'Payout ID required' }, { status: 400 })

        const updatedPayout = await db.payout.update({
            where: { id: payoutId },
            data: { 
                status: 'COMPLETED', 
                processedAt: new Date() 
            }
        })

        // Also update the related ProviderEarnings to PAID
        await db.providerEarning.updateMany({
            where: { providerId: updatedPayout.providerId, status: 'PAYOUT_INITIATED' },
            data: { status: 'PAID' }
        })

        return NextResponse.json({ success: true, data: updatedPayout })
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed to process payout' }, { status: 500 })
    }
}