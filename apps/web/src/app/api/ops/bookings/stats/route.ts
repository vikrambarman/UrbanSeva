// api/ops/bookings/stats/route.ts
// KYA: Dashboard stats API — calling team member ke assigned categories ki
// KYUN: Dashboard pe quick stats dikhane hain — kitni pending bookings hain,
//       kitni assign ki aaj, kitni reschedule ki, etc.

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCallingTeamUser, getStaffCategories } from '@/lib/auth'

export async function GET(request: NextRequest) {
    try {
        // ═══════════════════════════════════════════════════════════════
        // Auth check
        // ═══════════════════════════════════════════════════════════════
        const user = await getCallingTeamUser(request)
        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            )
        }

        // ═══════════════════════════════════════════════════════════════
        // Get staff's assigned categories
        // ═══════════════════════════════════════════════════════════════
        const categories = await getStaffCategories(user.userId)
        const categoryIds = categories.map(c => c.id)

        // Agar koi category assign nahi hai — to sab dikhao (admin override)
        const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN'

        // ═══════════════════════════════════════════════════════════════
        // Today's date range
        // ═══════════════════════════════════════════════════════════════
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)

        // ═══════════════════════════════════════════════════════════════
        // Build where clause — category filter
        // ═══════════════════════════════════════════════════════════════
        const categoryFilter = (!isAdmin && categoryIds.length > 0)
            ? { service: { subCategory: { categoryId: { in: categoryIds } } } }
            : {}

        // ═══════════════════════════════════════════════════════════════
        // Parallel queries for stats
        // ═══════════════════════════════════════════════════════════════
        const [
            totalPending,
            todayPending,
            todayAssigned,
            todayRescheduled,
            todayCancelled,
            totalUnassigned,
        ] = await Promise.all([
            // Total pending bookings (PENDING status)
            db.booking.count({
                where: {
                    status: 'PENDING',
                    ...categoryFilter,
                }
            }),

            // Today's pending bookings
            db.booking.count({
                where: {
                    status: 'PENDING',
                    scheduledDate: { gte: today, lt: tomorrow },
                    ...categoryFilter,
                }
            }),

            // Today's provider assigned (by this staff member)
            db.bookingAssignmentLog.count({
                where: {
                    actionBy: user.userId,
                    action: 'PROVIDER_ASSIGNED',
                    createdAt: { gte: today, lt: tomorrow },
                }
            }),

            // Today's rescheduled (by this staff member)
            db.bookingAssignmentLog.count({
                where: {
                    actionBy: user.userId,
                    action: 'RESCHEDULED',
                    createdAt: { gte: today, lt: tomorrow },
                }
            }),

            // Today's cancelled (by this staff member)
            db.bookingAssignmentLog.count({
                where: {
                    actionBy: user.userId,
                    action: 'CANCELLED',
                    createdAt: { gte: today, lt: tomorrow },
                }
            }),

            // Total unassigned bookings (no provider yet)
            db.booking.count({
                where: {
                    status: 'PENDING',
                    providerId: null,
                    ...categoryFilter,
                }
            }),
        ])

        // ═══════════════════════════════════════════════════════════════
        // Category-wise pending count
        // ═══════════════════════════════════════════════════════════════
        const categoryStats = await Promise.all(
            categories.map(async (cat) => {
                const count = await db.booking.count({
                    where: {
                        status: 'PENDING',
                        service: { subCategory: { categoryId: cat.id } },
                    }
                })
                return {
                    id: cat.id,
                    name: cat.name,
                    slug: cat.slug,
                    image: cat.image,
                    pendingCount: count,
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
                categoryStats,
                assignedCategories: categories,
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