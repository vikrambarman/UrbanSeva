import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getProviderUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
    try {
        const providerAuth = await getProviderUser(request)
        if (!providerAuth) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

        const provider = await db.provider.findUnique({ where: { userId: providerAuth.userId } })
        if (!provider) return NextResponse.json({ success: false, error: 'Provider not found' }, { status: 404 })

        const payouts = await db.payout.findMany({
            where: { providerId: provider.id },
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json({ success: true, data: payouts })
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed to fetch payouts' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const providerAuth = await getProviderUser(request)
        if (!providerAuth) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

        const provider = await db.provider.findUnique({ where: { userId: providerAuth.userId } })
        if (!provider) return NextResponse.json({ success: false, error: 'Provider not found' }, { status: 404 })

        // Calculate pending amount
        const pending = await db.providerEarning.aggregate({
            where: { providerId: provider.id, status: 'PENDING' },
            _sum: { net: true }
        })

        const amount = pending._sum.net || 0
        if (amount < 500) {
            return NextResponse.json({ success: false, error: 'Minimum payout amount is ₹500' }, { status: 400 })
        }

        // Create payout
        const payout = await db.payout.create({
            data: {
                providerId: provider.id,
                amount,
                method: provider.upiId ? 'UPI' : 'BANK_TRANSFER',
                status: 'PENDING'
            }
        })

        // Mark earnings as PAYOUT_INITIATED
        await db.providerEarning.updateMany({
            where: { providerId: provider.id, status: 'PENDING' },
            data: { status: 'PAYOUT_INITIATED' }
        })

        return NextResponse.json({ success: true, data: payout })
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed to request payout' }, { status: 500 })
    }
}