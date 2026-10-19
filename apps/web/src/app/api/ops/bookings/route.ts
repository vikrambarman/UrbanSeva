// api/ops/bookings/route.ts
// KYA: Bookings list API — calling team ke liye filtered bookings
// KYUN: Staff sirf apni assigned categories ki bookings dekhega
//       Filters: status, search, date, category

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
        const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN'

        // ═══════════════════════════════════════════════════════════════
        // Parse query params
        // ═══════════════════════════════════════════════════════════════
        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '20')
        const status = searchParams.get('status') 
        const search = searchParams.get('search') 
        const categoryId = searchParams.get('categoryId') 
        const dateFrom = searchParams.get('dateFrom')
        const dateTo = searchParams.get('dateTo')

        // ═══════════════════════════════════════════════════════════════
        // Build where clause
        // ═══════════════════════════════════════════════════════════════
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const where: any = {}

        // ✅ FIXED: Category filter logic
        if (categoryId && categoryId !== 'ALL') {
            where.service = { subCategory: { categoryId } }
        } else if (!isAdmin) {
            if (categoryIds.length > 0) {
                where.service = { subCategory: { categoryId: { in: categoryIds } } }
            } else {
                // ✅ SECURITY: Agar staff ko koi category assign nahi hai, toh wo kuch nahi dekh payega
                return NextResponse.json({
                    success: true,
                    data: {
                        bookings: [],
                        pagination: { page, limit, total: 0, totalPages: 0 }
                    }
                })
            }
        }

        // Status filter
        if (status && status !== 'ALL') {
            where.status = status
        }

        // Search filter
        if (search) {
            where.OR = [
                { bookingNumber: { contains: search, mode: 'insensitive' } },
                { user: { name: { contains: search, mode: 'insensitive' } } },
                { user: { phone: { contains: search, mode: 'insensitive' } } },
            ]
        }

        // Date range filter
        if (dateFrom || dateTo) {
            where.scheduledDate = {}
            if (dateFrom) where.scheduledDate.gte = new Date(dateFrom)
            if (dateTo) where.scheduledDate.lte = new Date(dateTo + 'T23:59:59')
        }

        // ═══════════════════════════════════════════════════════════════
        // Fetch bookings with pagination
        // ═══════════════════════════════════════════════════════════════
        const [bookings, total] = await Promise.all([
            db.booking.findMany({
                where,
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            phone: true,
                            email: true,
                        }
                    },
                    service: {
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                            image: true,
                            subCategory: {
                                select: {
                                    id: true,
                                    name: true,
                                    category: {
                                        select: {
                                            id: true,
                                            name: true,
                                        }
                                    }
                                }
                            }
                        }
                    },
                    provider: {
                        select: {
                            id: true,
                            user: {
                                select: {
                                    name: true,
                                    phone: true,
                                }
                            }
                        }
                    },
                    address: {
                        select: {
                            fullAddress: true,
                            area: true,
                            landmark: true,
                        }
                    },
                    payment: {
                        select: {
                            status: true,
                            amount: true,
                        }
                    }
                },
                orderBy: [
                    { status: 'asc' }, 
                    { scheduledDate: 'asc' }, 
                    { createdAt: 'desc' },
                ],
                skip: (page - 1) * limit,
                take: limit,
            }),
            db.booking.count({ where }),
        ])

        return NextResponse.json({
            success: true,
            data: {
                bookings,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                }
            }
        })

    } catch (error) {
        console.error('❌ Ops bookings list error:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}