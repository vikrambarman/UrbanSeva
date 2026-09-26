import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
    try {
        const admin = await getAdminUser(request)
        if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

        // Parallel fetch for stats
        const [
            totalUsers,
            totalProviders,
            totalBookings,
            revenueResult,
            pendingBookings,
            recentBookings
        ] = await Promise.all([
            db.user.count({ where: { role: 'CUSTOMER' } }),
            db.provider.count(),
            db.booking.count(),
            db.booking.aggregate({
                where: { paymentStatus: 'PAID' },
                _sum: { totalAmount: true }
            }),
            db.booking.count({ where: { status: 'PENDING' } }),
            db.booking.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: { select: { name: true, phone: true } },
                    service: { select: { name: true } }
                }
            })
        ])

        return NextResponse.json({
            success: true,
            data: {
                totalUsers,
                totalProviders,
                totalBookings,
                totalRevenue: revenueResult._sum.totalAmount || 0,
                pendingBookings,
                recentBookings
            }
        })
    } catch (error) {
        console.error('Dashboard Stats Error:', error)
        return NextResponse.json({ success: false, error: 'Failed to fetch stats' }, { status: 500 })
    }
}