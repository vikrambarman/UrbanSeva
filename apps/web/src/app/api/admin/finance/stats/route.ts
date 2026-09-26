import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
    try {
        const admin = await getAdminUser(request)
        if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

        const { searchParams } = new URL(request.url)
        const period = searchParams.get('period') || 'all' // all, month, week, today

        let dateFilter = {}
        const now = new Date()
        if (period === 'today') {
            dateFilter = { createdAt: { gte: new Date(now.setHours(0, 0, 0, 0)) } }
        } else if (period === 'week') {
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            dateFilter = { createdAt: { gte: weekAgo } }
        } else if (period === 'month') {
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
            dateFilter = { createdAt: { gte: monthAgo } }
        }

        // 1. Total Revenue (PAID Bookings)
        const revenueResult = await db.booking.aggregate({
            where: { paymentStatus: 'PAID', ...dateFilter },
            _sum: { totalAmount: true },
            _count: true
        })

        // 2. Platform Commission (From Provider Earnings)
        const commissionResult = await db.providerEarning.aggregate({
            where: dateFilter,
            _sum: { commission: true, net: true, gross: true }
        })

        // 3. Refunds
        const refundResult = await db.booking.aggregate({
            where: { 
                paymentStatus: { in: ['REFUNDED', 'REFUND_INITIATED'] },
                ...dateFilter 
            },
            _sum: { totalAmount: true },
            _count: true
        })

        // 4. Pending Payouts (Earnings not yet paid to provider)
        const pendingPayouts = await db.providerEarning.aggregate({
            where: { status: 'PENDING' },
            _sum: { net: true }
        })

        return NextResponse.json({
            success: true,
            data: {
                totalRevenue: revenueResult._sum.totalAmount || 0,
                totalBookings: revenueResult._count,
                platformCommission: commissionResult._sum.commission || 0,
                providerEarnings: commissionResult._sum.net || 0,
                grossEarnings: commissionResult._sum.gross || 0,
                totalRefunds: refundResult._sum.totalAmount || 0,
                refundCount: refundResult._count,
                pendingPayouts: pendingPayouts._sum.net || 0
            }
        })
    } catch (error) {
        console.error('Finance Stats Error:', error)
        return NextResponse.json({ success: false, error: 'Failed to fetch stats' }, { status: 500 })
    }
}