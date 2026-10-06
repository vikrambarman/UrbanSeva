// apps/web/src/app/api/ops/providers/search/route.ts
// KYA: Ops portal ke liye provider search API — category-wise ya name/phone se
// KYUN: CALLING_TEAM admin routes access nahi kar sakta, isliye alag endpoint chahiye
//       Jo sirf approved providers dikhaye aur category filter support kare

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
        const query = searchParams.get('query') || ''
        const category = searchParams.get('category') || ''

        // ═══════════════════════════════════════════════════════════════
        // Build where clause
        // ═══════════════════════════════════════════════════════════════
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const where: any = {
            status: 'APPROVED',
        }

        // Search by name or phone
        if (query) {
            where.OR = [
                { user: { name: { contains: query, mode: 'insensitive' } } },
                { user: { phone: { contains: query, mode: 'insensitive' } } },
            ]
        }

        // Filter by category
        if (category) {
            where.services = {
                some: {
                    service: {
                        subCategory: {
                            category: {
                                name: { equals: category, mode: 'insensitive' }
                            }
                        }
                    }
                }
            }
        }

        // ═══════════════════════════════════════════════════════════════
        // Fetch providers
        // ═══════════════════════════════════════════════════════════════
        const providers = await db.provider.findMany({
            where,
            select: {
                id: true,
                experience: true,
                avgRating: true,
                user: {
                    select: {
                        name: true,
                        phone: true,
                    }
                },
                // Count completed jobs
                _count: {
                    select: {
                        bookings: {
                            where: {
                                status: 'SERVICE_COMPLETED'
                            }
                        }
                    }
                },
                // Check if currently busy (has active booking today)
                bookings: {
                    where: {
                        status: {
                            in: ['PROVIDER_ASSIGNED', 'PROVIDER_TRAVELLING', 'SERVICE_STARTED']
                        },
                        scheduledDate: {
                            gte: new Date(new Date().setHours(0, 0, 0, 0)),
                            lte: new Date(new Date().setHours(23, 59, 59, 999)),
                        }
                    },
                    take: 1,
                }
            },
            orderBy: [
                { avgRating: 'desc' },
                { experience: 'desc' },
            ],
            take: 50,
        })

        // ═══════════════════════════════════════════════════════════════
        // Format response
        // ═══════════════════════════════════════════════════════════════
        const formattedProviders = providers.map(p => ({
            id: p.id,
            user: p.user,
            experience: p.experience,
            avgRating: p.avgRating,
            completedJobs: p._count.bookings,
            isAvailable: p.bookings.length === 0, // No active booking today = available
        }))

        return NextResponse.json({
            success: true,
            data: formattedProviders,
        }, {
            headers: {
                'Cache-Control': 'no-store, must-revalidate',
            }
        })

    } catch (error) {
        console.error('❌ Ops provider search error:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}