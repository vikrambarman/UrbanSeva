import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
    try {
        const admin = await getAdminUser(request)
        if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '10')
        const search = searchParams.get('search') || ''
        const status = searchParams.get('status')

        const where: any = {}
        
        if (search) {
            where.OR = [
                { user: { name: { contains: search, mode: 'insensitive' } } },
                { user: { phone: { contains: search } } },
            ]
        }
        if (status && status !== 'ALL') where.status = status

        const [providers, total] = await Promise.all([
            db.provider.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: { select: { name: true, phone: true, email: true, avatar: true } },
                    _count: { select: { services: true, bookings: true } }
                }
            }),
            db.provider.count({ where })
        ])

        return NextResponse.json({
            success: true,
            data: {
                providers,
                pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
            }
        })
    } catch (error) {
        console.error('Admin Providers GET Error:', error)
        return NextResponse.json({ success: false, error: 'Failed to fetch providers' }, { status: 500 })
    }
}