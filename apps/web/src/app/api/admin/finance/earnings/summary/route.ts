import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
    try {
        const admin = await getAdminUser(request)
        if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

        // 1. Sirf un providers ki IDs niklo jinke paas earnings hain
        const earningsGroup = await db.providerEarning.groupBy({
            by: ['providerId'],
            _sum: { 
                gross: true, 
                commission: true, 
                net: true 
            },
            _count: { id: true }
        })

        if (earningsGroup.length === 0) {
            return NextResponse.json({ success: true, data: [] })
        }

        const providerIds = earningsGroup.map(e => e.providerId)

        // 2. Provider details fetch karo
        const providers = await db.provider.findMany({
            where: { id: { in: providerIds } },
            select: {
                id: true,
                walletBalance: true,
                totalJobs: true,
                user: { 
                    select: { name: true, phone: true } 
                }
            }
        })

        const providerMap = new Map(
            providers.map(p => [p.id, {
                name: p.user?.name || 'Unnamed Provider',
                phone: p.user?.phone || '',
                walletBalance: p.walletBalance || 0,
                totalJobs: p.totalJobs || 0
            }])
        )

        // 3. Paid Payouts calculate karo (Direct Payout table se)
        const paidPayouts = await db.payout.groupBy({
            by: ['providerId'],
            where: { 
                providerId: { in: providerIds }, 
                status: 'COMPLETED' 
            },
            _sum: { amount: true }
        })
        const paidMap = new Map(paidPayouts.map(p => [p.providerId, p._sum.amount || 0]))

        // 4. ✅ FIX: Pending Payouts calculate karo (PAYOUT_INITIATED hata diya kyunki wo EarningStatus hai)
        const pendingPayouts = await db.payout.groupBy({
            by: ['providerId'],
            where: { 
                providerId: { in: providerIds }, 
                status: { in: ['PENDING', 'PROCESSING'] } 
            },
            _sum: { amount: true }
        })
        const pendingMap = new Map(pendingPayouts.map(p => [p.providerId, p._sum.amount || 0]))

        // 5. Final Data Combine karo
        const summary = earningsGroup.map(e => {
            const provider = providerMap.get(e.providerId) || {
                name: 'Unnamed Provider',
                phone: '',
                walletBalance: 0,
                totalJobs: 0
            }

            return {
                providerId: e.providerId,
                providerName: provider.name,
                providerPhone: provider.phone,
                gross: e._sum.gross || 0,
                commission: e._sum.commission || 0,
                net: e._sum.net || 0,
                paid: paidMap.get(e.providerId) || 0,
                pending: pendingMap.get(e.providerId) || 0,
                walletBalance: provider.walletBalance,
                totalJobs: provider.totalJobs,
                bookingCount: e._count.id
            }
        })

        // Net earnings ke hisaab se sort karo
        summary.sort((a, b) => b.net - a.net)

        return NextResponse.json({ success: true, data: summary })

    } catch (error) {
        console.error('Earnings Summary Error:', error)
        return NextResponse.json({ success: false, error: 'Failed to fetch earnings summary' }, { status: 500 })
    }
}