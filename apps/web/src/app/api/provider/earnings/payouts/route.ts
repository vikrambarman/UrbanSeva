import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getProviderUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
    try {
        const providerAuth = await getProviderUser(request)
        if (!providerAuth) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

        const provider = await db.provider.findUnique({ where: { userId: providerAuth.userId } })
        if (!provider) return NextResponse.json({ success: false, error: 'Provider not found' }, { status: 404 })

        // ✅ FIX: Include provider relation for complete data
        const payouts = await db.payout.findMany({
            where: { providerId: provider.id },
            include: {
                provider: {
                    include: {
                        user: { select: { name: true, phone: true } }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        })

        // ✅ FIX: Add cache headers to prevent stale data
        return NextResponse.json(
            { success: true, data: payouts },
            {
                headers: {
                    'Cache-Control': 'no-store, max-age=0'
                }
            }
        )
    } catch (error) {
        console.error('Fetch payouts error:', error)
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

        // Check if there's already a pending payout
        const existingPending = await db.payout.findFirst({
            where: { providerId: provider.id, status: 'PENDING' }
        })

        if (existingPending) {
            return NextResponse.json({ success: false, error: 'You already have a pending payout request' }, { status: 400 })
        }

        // Create payout
        const payout = await db.payout.create({
            data: {
                providerId: provider.id,
                amount,
                method: provider.upiId ? 'UPI' : provider.bankAccount ? 'BANK_TRANSFER' : 'CASH',
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
        console.error('Create payout error:', error)
        return NextResponse.json({ success: false, error: 'Failed to request payout' }, { status: 500 })
    }
}