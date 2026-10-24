import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCallingTeamUser } from '@/lib/auth'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCallingTeamUser(request)
        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const { id } = await params

        const provider = await db.provider.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        name: true,
                        phone: true,
                        email: true,
                        avatar: true,
                    }
                },
                // ✅ FIX: Services ko properly include karo
                services: {
                    where: { isActive: true },
                    include: {
                        service: {
                            include: {
                                subCategory: {
                                    include: {
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
                earnings: {
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                },
                _count: {
                    select: {
                        bookings: {
                            where: {
                                status: 'SERVICE_COMPLETED'
                            }
                        }
                    }
                }
            }
        })

        if (!provider) {
            return NextResponse.json(
                { success: false, error: 'Provider not found' },
                { status: 404 }
            )
        }

        // ✅ FIX: Services ko flatten karo frontend ke liye
        const formattedProvider = {
            ...provider,
            completedJobs: provider._count.bookings,
            services: provider.services.map(ps => ({
                id: ps.id,
                serviceId: ps.service.id,
                name: ps.service.name,
                image: ps.service.image,
                category: ps.service.subCategory.category.name,
                customPrice: ps.customPrice,
                isActive: ps.isActive,
            }))
        }

        return NextResponse.json({
            success: true,
            data: formattedProvider
        }, {
            headers: {
                'Cache-Control': 'no-store, must-revalidate',
            }
        })

    } catch (error) {
        console.error('❌ Ops provider detail error:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCallingTeamUser(request)
        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const { id } = await params
        const body = await request.json()
        const { action } = body // 'APPROVE' | 'REJECT'

        if (!action || !['APPROVE', 'REJECT'].includes(action)) {
            return NextResponse.json(
                { success: false, error: 'Invalid action' },
                { status: 400 }
            )
        }

        const newStatus = action === 'APPROVE' ? 'APPROVED' : 'REJECTED'

        const updatedProvider = await db.provider.update({
            where: { id },
            data: { status: newStatus },
            include: {
                user: {
                    select: {
                        name: true,
                        phone: true,
                        email: true,
                    }
                }
            }
        })

        return NextResponse.json({
            success: true,
            message: `Provider ${action === 'APPROVE' ? 'approved' : 'rejected'} successfully`,
            data: updatedProvider
        })

    } catch (error) {
        console.error('❌ Ops provider action error:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}