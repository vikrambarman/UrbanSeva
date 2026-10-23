import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
    try {
        const admin = await getAdminUser(request)
        if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

        // 1. Total earnings per provider (Gross, Commission, Net)
        const earningsByProvider = await db.providerEarning.groupBy({
            by: ['providerId'],
            _sum: {
                gross: true,
                commission: true,
                net: true
            },
            _count: {
                id: true
            }
        })

        if (earningsByProvider.length === 0) {
            return NextResponse.json({ success: true, data: [] })
        }

        // 2. ✅ FIX: Pending earnings (PENDING + PAYOUT_INITIATED status)
        const pendingByProvider = await db.providerEarning.groupBy({
            by: ['providerId'],
            where: { 
                status: { 
                    in: ['PENDING', 'PAYOUT_INITIATED'] // ✅ Dono status ko include karo
                } 
            },
            _sum: { net: true }
        })

        const pendingMap = new Map(
            pendingByProvider.map(p => [p.providerId, p._sum.net || 0])
        )

        // 3. ✅ NEW: Total paid earnings per provider
        const paidByProvider = await db.providerEarning.groupBy({
            by: ['providerId'],
            where: { status: 'PAID' },
            _sum: { net: true }
        })

        const paidMap = new Map(
            paidByProvider.map(p => [p.providerId, p._sum.net || 0])
        )

        // 4. Fetch provider details with wallet balance
        const providerIds = earningsByProvider.map(e => e.providerId)
        
        const providers = await db.provider.findMany({
            where: { id: { in: providerIds } },
            select: {
                id: true,
                walletBalance: true,
                totalJobs: true,
                user: { 
                    select: { 
                        name: true,
                        phone: true 
                    } 
                }
            }
        })

        const providerMap = new Map(
            providers.map(p => [
                p.id, 
                {
                    name: p.user?.name || 'Unnamed Provider',
                    phone: p.user?.phone || '',
                    walletBalance: p.walletBalance || 0,
                    totalJobs: p.totalJobs || 0
                }
            ])
        )

        // 5. Combine and format data
        const summary = earningsByProvider.map(e => {
            const providerInfo = providerMap.get(e.providerId) || {
                name: 'Unnamed Provider',
                phone: '',
                walletBalance: 0,
                totalJobs: 0
            }

            return {
                providerId: e.providerId,
                providerName: providerInfo.name,
                providerPhone: providerInfo.phone,
                gross: e._sum.gross || 0,
                commission: e._sum.commission || 0,
                net: e._sum.net || 0,
                pending: pendingMap.get(e.providerId) || 0,
                paid: paidMap.get(e.providerId) || 0,
                walletBalance: providerInfo.walletBalance,
                totalJobs: providerInfo.totalJobs,
                bookingCount: e._count.id
            }
        })

        // Sort by net earnings descending
        summary.sort((a, b) => b.net - a.net)

        return NextResponse.json({ success: true, data: summary })

    } catch (error) {
        console.error('Earnings Summary Error:', error)
        return NextResponse.json({ success: false, error: 'Failed to fetch earnings summary' }, { status: 500 })
    }
}