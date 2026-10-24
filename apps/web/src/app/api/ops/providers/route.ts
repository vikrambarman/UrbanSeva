// apps/web/src/app/api/ops/providers/route.ts
// CHANGE: Provider Helpdesk ke liye main list route
// WHY: Ops team ko saare providers dikhne chahiye (PENDING, APPROVED, REJECTED, etc.)
//       with pagination, search, aur status filter support

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
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '20')
        const search = searchParams.get('search') || ''
        const status = searchParams.get('status') || 'ALL'

        const skip = (page - 1) * limit

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const where: any = {}

        // Status filter (ALL = no filter, otherwise exact match)
        if (status && status !== 'ALL') {
            where.status = status
        }

        // Search by provider name, phone, or email
        if (search) {
            where.OR = [
                { user: { name: { contains: search, mode: 'insensitive' } } },
                { user: { phone: { contains: search, mode: 'insensitive' } } },
                { user: { email: { contains: search, mode: 'insensitive' } } },
            ]
        }

        const [providers, total] = await Promise.all([
            db.provider.findMany({
                where,
                select: {
                    id: true,
                    status: true,
                    bio: true,
                    experience: true,
                    avgRating: true,
                    totalJobs: true,
                    totalEarnings: true,
                    isAvailable: true,
                    createdAt: true,
                    user: {
                        select: {
                            name: true,
                            phone: true,
                            email: true,
                            avatar: true,
                        }
                    },
                    services: {
                        where: { isActive: true },
                        select: {
                            service: {
                                select: {
                                    id: true,
                                    name: true,
                                    subCategory: {
                                        select: {
                                            category: {
                                                select: {
                                                    name: true,
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    _count: {
                        select: {
                            bookings: {
                                where: {
                                    status: 'SERVICE_COMPLETED'
                                }
                            }
                        }
                    },
                },
                orderBy: [
                    { createdAt: 'desc' },
                ],
                skip,
                take: limit,
            }),
            db.provider.count({ where })
        ])

        // Format providers for frontend
        const formattedProviders = providers.map(p => ({
            id: p.id,
            status: p.status,
            bio: p.bio,
            experience: p.experience,
            avgRating: p.avgRating,
            totalJobs: p.totalJobs,
            totalEarnings: p.totalEarnings,
            isAvailable: p.isAvailable,
            createdAt: p.createdAt,
            user: p.user,
            completedJobs: p._count.bookings,
            services: p.services.map(s => ({
                id: s.service.id,
                name: s.service.name,
                category: s.service.subCategory.category.name,
            })),
        }))

        return NextResponse.json({
            success: true,
            data: {
                providers: formattedProviders,
                total,
                page,
                limit,
            }
        }, {
            headers: {
                'Cache-Control': 'no-store, must-revalidate',
            }
        })

    } catch (error) {
        console.error('❌ Ops providers list error:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}