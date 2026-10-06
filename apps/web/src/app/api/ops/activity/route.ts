// api/ops/activity/route.ts
// KYA: Calling team member ki activity logs fetch kare
// KYUN: Staff ko apni recent activities dikhani hain — accountability ke liye

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCallingTeamUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
    try {
        const user = await getCallingTeamUser(request)
        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const { searchParams } = new URL(request.url)
        const limit = parseInt(searchParams.get('limit') || '50')

        // Fetch activity logs for this staff member
        const logs = await db.bookingAssignmentLog.findMany({
            where: {
                actionBy: user.userId,
            },
            include: {
                booking: {
                    select: {
                        bookingNumber: true,
                        user: {
                            select: {
                                name: true,
                                phone: true,
                            }
                        },
                        service: {
                            select: {
                                name: true,
                            }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: 'desc',
            },
            take: limit,
        })

        return NextResponse.json({
            success: true,
            data: logs,
        })

    } catch (error) {
        console.error('❌ Ops activity error:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}