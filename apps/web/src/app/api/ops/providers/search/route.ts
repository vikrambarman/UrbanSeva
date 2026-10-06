// apps/web/src/app/api/ops/providers/search/route.ts
// CHANGE: Provider ki services list, bio, aur email bhi return karega
// CHANGE: Ops team ko provider ki full details dikhengi
// WHY: Ops team ko pata hona chahiye ki provider kaunsi services provide karta hai
//       aur usse kaise contact karein (Call, WhatsApp)

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

        // Filter by category name
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

        const providers = await db.provider.findMany({
            where,
            select: {
                id: true,
                experience: true,
                avgRating: true,
                bio: true, // CHANGE: Bio include kiya
                user: {
                    select: {
                        name: true,
                        phone: true,
                        email: true, // CHANGE: Email include kiya
                        avatar: true, // CHANGE: Avatar include kiya
                    }
                },
                // CHANGE: Provider ki services list include ki
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

        // CHANGE: Enhanced response with services list
        const formattedProviders = providers.map(p => ({
            id: p.id,
            user: p.user,
            bio: p.bio,
            experience: p.experience,
            avgRating: p.avgRating,
            completedJobs: p._count.bookings,
            isAvailable: p.bookings.length === 0,
            // CHANGE: Services list flatten ki
            services: p.services.map(s => ({
                id: s.service.id,
                name: s.service.name,
                category: s.service.subCategory.category.name,
            })),
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