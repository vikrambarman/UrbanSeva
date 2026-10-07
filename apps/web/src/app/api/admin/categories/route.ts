// apps/web/src/app/api/admin/categories/route.ts
/**
 * WHAT: Admin API to fetch all categories
 * WHY: Admin panel mein categories list dikhane ke liye
 * NOTE: GST fields bhi return karega
 */

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

export async function GET(request: Request) {
    try {
        const authHeader = request.headers.get('authorization')
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const token = authHeader.substring(7)
        const payload = verifyToken(token)
        if (!payload || (payload.role !== 'ADMIN' && payload.role !== 'SUPER_ADMIN')) {
            return NextResponse.json(
                { success: false, error: 'Forbidden' },
                { status: 403 }
            )
        }

        const categories = await db.category.findMany({
            include: {
                subCategories: {
                    include: {
                        services: {
                            select: {
                                id: true,
                                name: true,
                                basePrice: true,
                                isActive: true,
                            },
                        },
                    },
                },
            },
            orderBy: { sortOrder: 'asc' },
        })

        return NextResponse.json({
            success: true,
            data: categories,
        })
    } catch (error) {
        console.error('Get Categories Error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch categories' },
            { status: 500 }
        )
    }
}