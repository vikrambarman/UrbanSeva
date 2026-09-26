import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
    try {
        const admin = await getAdminUser(request)
        if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

        const { searchParams } = new URL(request.url)
        const days = parseInt(searchParams.get('period') || '30')

        const startDate = new Date()
        startDate.setDate(startDate.getDate() - days)

        // New user registrations per day
        const newUsers = await db.user.count({
            where: {
                role: 'CUSTOMER',
                createdAt: { gte: startDate }
            }
        })

        // Active users (who booked in this period)
        const activeUsers = await db.booking.findMany({
            where: {
                createdAt: { gte: startDate },
                user: { role: 'CUSTOMER' }
            },
            select: { userId: true },
            distinct: ['userId']
        })

        // Loyalty tier distribution
        const tierDistribution = await db.user.groupBy({
            by: ['loyaltyTier'],
            where: { role: 'CUSTOMER' },
            _count: { id: true }
        })

        // Repeat vs new customers
        const allBookings = await db.booking.findMany({
            where: { createdAt: { gte: startDate } },
            select: { userId: true },
        })

        const userBookingCount: Record<string, number> = {}
        allBookings.forEach(b => {
            userBookingCount[b.userId] = (userBookingCount[b.userId] || 0) + 1
        })

        const repeatCustomers = Object.values(userBookingCount).filter(c => c > 1).length
        const newCustomers = Object.values(userBookingCount).filter(c => c === 1).length

        return NextResponse.json({
            success: true,
            data: {
                newUsers,
                activeUsers: activeUsers.length,
                tierDistribution: tierDistribution.map(t => ({
                    tier: t.loyaltyTier,
                    count: t._count.id
                })),
                retention: {
                    repeat: repeatCustomers,
                    new: newCustomers,
                    retentionRate: allBookings.length > 0
                        ? Math.round((repeatCustomers / (repeatCustomers + newCustomers)) * 100)
                        : 0
                }
            }
        })
    } catch (error) {
        console.error('Customer Analytics Error:', error)
        return NextResponse.json({ success: false, error: 'Failed to fetch analytics' }, { status: 500 })
    }
}