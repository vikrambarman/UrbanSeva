// apps/web/src/app/api/ops/finance/stats/route.ts
/**
 * WHAT: OPS Financial statistics API
 * WHY: Dashboard ko revenue, payout, POD data chahiye
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCallingTeamUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
    try {
        const user = await getCallingTeamUser(request)
        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        const now = new Date()
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        const monthStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

        // Revenue calculations
        const [
            todayRevenue,
            weekRevenue,
            monthRevenue,
            totalRevenue,
            onlineRevenue,
            podRevenue,
            podPending,
            totalCommission,
            totalPayouts,
            pendingPayouts,
            todayBookings,
            completedBookings,
        ] = await Promise.all([
            // Today's revenue
            db.booking.aggregate({
                where: { 
                    completedAt: { gte: todayStart },
                    status: 'SERVICE_COMPLETED'
                },
                _sum: { totalAmount: true }
            }),
            // Week revenue
            db.booking.aggregate({
                where: { 
                    completedAt: { gte: weekStart },
                    status: 'SERVICE_COMPLETED'
                },
                _sum: { totalAmount: true }
            }),
            // Month revenue
            db.booking.aggregate({
                where: { 
                    completedAt: { gte: monthStart },
                    status: 'SERVICE_COMPLETED'
                },
                _sum: { totalAmount: true }
            }),
            // Total revenue
            db.booking.aggregate({
                where: { status: 'SERVICE_COMPLETED' },
                _sum: { totalAmount: true }
            }),
            // Online revenue
            db.booking.aggregate({
                where: { 
                    status: 'SERVICE_COMPLETED',
                    paymentMethod: 'ONLINE'
                },
                _sum: { totalAmount: true }
            }),
            // POD collected revenue
            db.booking.aggregate({
                where: { 
                    status: 'SERVICE_COMPLETED',
                    paymentMethod: { in: ['POD', 'COD'] },
                    codAmountCollected: { not: null }
                },
                _sum: { codAmountCollected: true }
            }),
            // POD pending (not collected yet)
            db.booking.aggregate({
                where: { 
                    status: 'SERVICE_COMPLETED',
                    paymentMethod: { in: ['POD', 'COD'] },
                    codAmountCollected: null
                },
                _sum: { totalAmount: true }
            }),
            // Total commission
            db.providerEarning.aggregate({
                _sum: { commission: true }
            }),
            // Total payouts completed
            db.payout.aggregate({
                where: { status: 'COMPLETED' },
                _sum: { amount: true }
            }),
            // Pending payouts
            db.payout.aggregate({
                where: { status: 'PENDING' },
                _sum: { amount: true }
            }),
            // Today's bookings count
            db.booking.count({
                where: { createdAt: { gte: todayStart } }
            }),
            // Total completed bookings
            db.booking.count({
                where: { status: 'SERVICE_COMPLETED' }
            }),
        ])

        // Pending POD bookings (service completed but amount not collected)
        const pendingPODs = await db.booking.findMany({
            where: {
                status: 'SERVICE_COMPLETED',
                paymentMethod: { in: ['POD', 'COD'] },
                codAmountCollected: null
            },
            include: {
                provider: {
                    include: {
                        user: { select: { name: true, phone: true } }
                    }
                },
                service: { select: { name: true } },
                user: { select: { name: true } }
            },
            orderBy: { completedAt: 'desc' },
            take: 20
        })

        // Recent payouts
        const recentPayouts = await db.payout.findMany({
            include: {
                provider: {
                    include: {
                        user: { select: { name: true, phone: true } }
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 20
        })

        return NextResponse.json({
            success: true,
            data: {
                stats: {
                    todayRevenue: todayRevenue._sum.totalAmount || 0,
                    weekRevenue: weekRevenue._sum.totalAmount || 0,
                    monthRevenue: monthRevenue._sum.totalAmount || 0,
                    totalRevenue: totalRevenue._sum.totalAmount || 0,
                    onlineRevenue: onlineRevenue._sum.totalAmount || 0,
                    podRevenue: podRevenue._sum.codAmountCollected || 0,
                    podPending: podPending._sum.totalAmount || 0,
                    totalCommission: totalCommission._sum.commission || 0,
                    totalPayouts: totalPayouts._sum.amount || 0,
                    pendingPayouts: pendingPayouts._sum.amount || 0,
                    todayBookings,
                    completedBookings,
                },
                pendingPODs: pendingPODs.map(p => ({
                    id: p.id,
                    bookingNumber: p.bookingNumber,
                    providerName: p.provider?.user?.name || 'Unknown',
                    providerPhone: p.provider?.user?.phone || '',
                    totalAmount: p.totalAmount,
                    codAmountCollected: p.codAmountCollected,
                    completedAt: p.completedAt,
                    serviceName: p.service?.name || '',
                    customerName: p.user?.name || 'Unknown',
                })),
                recentPayouts: recentPayouts.map(p => ({
                    id: p.id,
                    providerName: p.provider?.user?.name || 'Unknown',
                    providerPhone: p.provider?.user?.phone || '',
                    amount: p.amount,
                    method: p.method,
                    status: p.status,
                    createdAt: p.createdAt,
                    reference: p.reference,
                })),
            }
        })
    } catch (error) {
        console.error('OPS Finance Stats Error:', error)
        return NextResponse.json({ success: false, error: 'Failed to fetch stats' }, { status: 500 })
    }
}