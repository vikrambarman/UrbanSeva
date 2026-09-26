import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
    try {
        const admin = await getAdminUser(request)
        if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

        const providers = await db.provider.findMany({
            where: {
                status: { in: ['PENDING', 'UNDER_REVIEW'] }
            },
            orderBy: { createdAt: 'asc' },
            include: {
                user: { select: { name: true, phone: true, email: true, avatar: true } },
                _count: { select: { services: true } }
            }
        })

        return NextResponse.json({ success: true, data: providers })
    } catch (error) {
        console.error('Admin Provider Applications Error:', error)
        return NextResponse.json({ success: false, error: 'Failed to fetch applications' }, { status: 500 })
    }
}