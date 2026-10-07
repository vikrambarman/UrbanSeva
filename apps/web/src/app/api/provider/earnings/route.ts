/**
 * WHAT: Provider earnings with POD vs Online breakdown
 * WHY: Provider ko clear picture mile ki online vs POD se kitna kamaya
 */

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
        const period = searchParams.get('period') || 'all'

        let dateFilter = {}
        const now = new Date()
        if (period === 'week') dateFilter = { createdAt: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } }
        else if (period === 'month') dateFilter = { createdAt: { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) } }

        const [earnings, stats, onlineStats, podStats, pendingAmount] = await Promise.all([
            // All earnings
            db.providerEarning.findMany({
                where: { providerId: provider.id, ...dateFilter },
                orderBy: { createdAt: 'desc' },
                take: 50,
            }),
            // Total stats
            db.providerEarning.aggregate({
                where: { providerId: provider.id, ...dateFilter },
                _sum: { gross: true, commission: true, net: true },
                _count: true
            }),
            // Online earnings stats
            db.providerEarning.aggregate({
                where: { providerId: provider.id, ...dateFilter, paymentMethod: 'ONLINE' },
                _sum: { net: true },
            }),
            // POD earnings stats
            db.providerEarning.aggregate({
                where: { providerId: provider.id, ...dateFilter, paymentMethod: 'POD' },
                _sum: { net: true },
            }),
            // Pending payout amount (SETTLED status only)
            db.providerEarning.aggregate({
                where: { providerId: provider.id, status: { in: ['SETTLED', 'PENDING'] } },
                _sum: { net: true }
            })
        ])

        return NextResponse.json({
            success: true,
            data: {
                earnings,
                stats: {
                    totalGross: stats._sum.gross || 0,
                    totalCommission: stats._sum.commission || 0,
                    totalNet: stats._sum.net || 0,
                    totalJobs: stats._count,
                    onlineNet: onlineStats._sum.net || 0,
                    podNet: podStats._sum.net || 0,
                    pendingPayout: pendingAmount._sum.net || 0
                }
            }
        })
    } catch (error) {
        console.error('Provider Earnings Error:', error)
        return NextResponse.json({ success: false, error: 'Failed to fetch earnings' }, { status: 500 })
    }
}