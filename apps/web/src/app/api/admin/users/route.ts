// src/app/api/admin/users/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminUser } from '@/lib/auth'

const VALID_ROLES = ['CUSTOMER', 'PROVIDER', 'ADMIN', 'SUPER_ADMIN']

export async function GET(request: NextRequest) {
    try {
        const admin = await getAdminUser(request)
        if (!admin) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const page = Math.max(1, parseInt(searchParams.get('page') || '1') || 1)
        const limit = parseInt(searchParams.get('limit') || '10')
        const search = searchParams.get('search')?.trim() || ''
        const roleParam = searchParams.get('role')?.trim().toUpperCase()
        const isActiveParam = searchParams.get('status') ?? searchParams.get('isActive')

        const where: any = {}
        
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search } },
                { email: { contains: search, mode: 'insensitive' } },
            ]
        }

        if (roleParam && roleParam !== 'ALL') {
            if (VALID_ROLES.includes(roleParam)) {
                where.role = roleParam
            }
        }

        if (isActiveParam !== null && isActiveParam !== undefined && isActiveParam !== '' && isActiveParam !== 'ALL') {
            where.isActive = isActiveParam === 'true'
        }

        const [users, total] = await Promise.all([
            db.user.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    name: true,
                    phone: true,
                    email: true,
                    avatar: true,
                    role: true,
                    isActive: true,
                    isVerified: true,
                    createdAt: true,
                    walletBalance: true,
                    loyaltyTier: true,
                    _count: {
                        select: { bookings: true, reviews: true }
                    }
                }
            }),
            db.user.count({ where })
        ])

        return NextResponse.json({
            success: true,
            data: {
                users,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit) || 1
                }
            }
        })
    } catch (error) {
        console.error('Admin Users GET Error:', error)
        return NextResponse.json({ success: false, error: 'Failed to fetch users' }, { status: 500 })
    }
}