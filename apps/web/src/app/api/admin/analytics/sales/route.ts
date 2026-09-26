import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
    try {
        const admin = await getAdminUser(request)
        if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

        const { searchParams } = new URL(request.url)
        const period = searchParams.get('period') || '30' // days
        const days = parseInt(period)

        const startDate = new Date()
        startDate.setDate(startDate.getDate() - days)

        // Daily revenue for the period
        const bookings = await db.booking.findMany({
            where: {
                paymentStatus: 'PAID',
                createdAt: { gte: startDate }
            },
            select: {
                totalAmount: true,
                createdAt: true,
                serviceId: true,
            },
            orderBy: { createdAt: 'asc' }
        })

        // Group by date
        const dailyRevenue: Record<string, { revenue: number; count: number }> = {}
        for (let i = 0; i < days; i++) {
            const date = new Date()
            date.setDate(date.getDate() - (days - 1 - i))
            const key = date.toISOString().split('T')[0]
            dailyRevenue[key] = { revenue: 0, count: 0 }
        }

        bookings.forEach(b => {
            const key = b.createdAt.toISOString().split('T')[0]
            if (dailyRevenue[key]) {
                dailyRevenue[key].revenue += b.totalAmount
                dailyRevenue[key].count += 1
            }
        })

        const chartData = Object.entries(dailyRevenue).map(([date, data]) => ({
            date,
            revenue: data.revenue,
            bookings: data.count
        }))

        // Summary
        const totalRevenue = bookings.reduce((sum, b) => sum + b.totalAmount, 0)
        const avgOrderValue = bookings.length > 0 ? totalRevenue / bookings.length : 0

        return NextResponse.json({
            success: true,
            data: {
                chartData,
                summary: {
                    totalRevenue,
                    totalBookings: bookings.length,
                    avgOrderValue: Math.round(avgOrderValue),
                    period: `${days} days`
                }
            }
        })
    } catch (error) {
        console.error('Sales Analytics Error:', error)
        return NextResponse.json({ success: false, error: 'Failed to fetch analytics' }, { status: 500 })
    }
}