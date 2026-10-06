/**
 * WHAT: Dashboard stats with new production statuses
 * WHY: 
 * - Add paymentReceivedCount
 * - Add pendingConfirmationCount
 * - Add reschedulePendingCount
 * NOTE: Backward compatible
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCallingTeamUser, getStaffCategories } from '@/lib/auth'

export async function GET(request: NextRequest) {
    try {
        const user = await getCallingTeamUser(request)
        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const categories = await getStaffCategories(user.userId)
        const categoryIds = categories.map(c => c.id)
        const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN'

        // Base where clause
        const baseWhere: any = {}
        if (!isAdmin && categoryIds.length > 0) {
            baseWhere.service = { subCategory: { categoryId: { in: categoryIds } } }
        }

        // Today's date range
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)

        // Fetch all stats in parallel
        const [
            totalPending,
            todayPending,
            todayAssigned,
            todayRescheduled,
            todayCancelled,
            totalUnassigned,
            // NEW: Production flow stats
            paymentReceivedCount,
            pendingConfirmationCount,
            reschedulePendingCount,
        ] = await Promise.all([
            // Total pending
            db.booking.count({
                where: { ...baseWhere, status: { in: ['PENDING', 'PAYMENT_RECEIVED', 'PENDING_CONFIRMATION'] } }
            }),
            // Today's pending
            db.booking.count({
                where: {
                    ...baseWhere,
                    status: { in: ['PENDING', 'PAYMENT_RECEIVED', 'PENDING_CONFIRMATION'] },
                    scheduledDate: { gte: today, lt: tomorrow }
                }
            }),
            // Today's assigned
            db.booking.count({
                where: {
                    ...baseWhere,
                    status: 'PROVIDER_ASSIGNED',
                    createdAt: { gte: today, lt: tomorrow }
                }
            }),
            // Today's rescheduled
            db.booking.count({
                where: {
                    ...baseWhere,
                    status: 'RESCHEDULE_PENDING',
                    updatedAt: { gte: today, lt: tomorrow }
                }
            }),
            // Today's cancelled
            db.booking.count({
                where: {
                    ...baseWhere,
                    status: { in: ['CANCELLED', 'CANCELLED_BY_CUSTOMER', 'CANCELLED_BY_OPS', 'CANCELLED_BY_PROVIDER'] },
                    cancelledAt: { gte: today, lt: tomorrow }
                }
            }),
            // Total unassigned
            db.booking.count({
                where: {
                    ...baseWhere,
                    providerId: null,
                    status: { notIn: ['CANCELLED', 'REFUNDED', 'SERVICE_COMPLETED'] }
                }
            }),
            // NEW: Payment received count
            db.booking.count({
                where: { ...baseWhere, status: 'PAYMENT_RECEIVED' }
            }),
            // NEW: Pending confirmation count
            db.booking.count({
                where: { ...baseWhere, status: 'PENDING_CONFIRMATION' }
            }),
            // NEW: Reschedule pending count
            db.booking.count({
                where: { ...baseWhere, status: 'RESCHEDULE_PENDING' }
            }),
        ])

        // Category-wise stats
        const categoryStats = await Promise.all(
            categories.map(async (cat) => {
                const pendingCount = await db.booking.count({
                    where: {
                        service: { subCategory: { categoryId: cat.id } },
                        status: { in: ['PENDING', 'PAYMENT_RECEIVED', 'PENDING_CONFIRMATION'] }
                    }
                })

                return {
                    id: cat.id,
                    name: cat.name,
                    slug: cat.slug,
                    image: cat.image,
                    pendingCount,
                }
            })
        )

        return NextResponse.json({
            success: true,
            data: {
                totalPending,
                todayPending,
                todayAssigned,
                todayRescheduled,
                todayCancelled,
                totalUnassigned,
                // NEW: Production flow stats
                paymentReceivedCount,
                pendingConfirmationCount,
                reschedulePendingCount,
                categoryStats,
                assignedCategories: categories.map(c => ({
                    id: c.id,
                    name: c.name,
                    slug: c.slug,
                })),
            }
        })

    } catch (error) {
        console.error('❌ Ops stats error:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}