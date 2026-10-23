import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
    try {
        const admin = await getAdminUser(request)
        if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

        // Total paid (completed payouts)
        const completedPayouts = await db.payout.aggregate({
            where: { status: 'COMPLETED' },
            _sum: { amount: true },
            _count: true
        })

        // Pending payouts
        const pendingPayouts = await db.payout.aggregate({
            where: { status: 'PENDING' },
            _sum: { amount: true },
            _count: true
        })

        // This month's payouts
        const startOfMonth = new Date()
        startOfMonth.setDate(1)
        startOfMonth.setHours(0, 0, 0, 0)

        const thisMonthPayouts = await db.payout.aggregate({
            where: {
                status: 'COMPLETED',
                processedAt: { gte: startOfMonth }
            },
            _sum: { amount: true },
            _count: true
        })

        // Unique providers paid
        const uniqueProviders = await db.payout.groupBy({
            by: ['providerId'],
            where: { status: 'COMPLETED' },
            _count: { providerId: true }
        })

        return NextResponse.json({
            success: true,
            data: {
                totalPaid: completedPayouts._sum.amount || 0,
                completedCount: completedPayouts._count,
                totalPending: pendingPayouts._sum.amount || 0,
                pendingCount: pendingPayouts._count,
                thisMonth: thisMonthPayouts._sum.amount || 0,
                thisMonthCount: thisMonthPayouts._count,
                uniqueProviders: uniqueProviders.length
            }
        })
    } catch (error) {
        console.error('Payout Summary Error:', error)
        return NextResponse.json({ success: false, error: 'Failed to fetch summary' }, { status: 500 })
    }
}