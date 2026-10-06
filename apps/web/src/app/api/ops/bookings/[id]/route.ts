// apps/web/src/app/api/ops/bookings/[id]/route.ts
// CHANGE: Provider ki services list bhi include ki
// CHANGE: Provider ka email bhi include kiya
// WHY: Ops team ko provider ki complete details chahiye — services, email, etc.

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCallingTeamUser, getStaffCategories } from '@/lib/auth'

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

        const booking = await db.booking.findUnique({
            where: { id },
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
                        basePrice: true,
                        subCategory: {
                            select: {
                                id: true,
                                name: true,
                                categoryId: true,
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
                // CHANGE: Provider with services and email
                provider: {
                    select: {
                        id: true,
                        bio: true,
                        experience: true,
                        avgRating: true,
                        user: {
                            select: {
                                name: true,
                                phone: true,
                                email: true, // CHANGE: Email include kiya
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
                        }
                    }
                },
                address: {
                    select: {
                        label: true,
                        fullAddress: true,
                        area: true,
                        landmark: true,
                        pincode: true,
                    }
                },
                payment: {
                    select: {
                        id: true,
                        amount: true,
                        status: true,
                        method: true,
                        paidAt: true,
                    }
                },
                statusHistory: {
                    orderBy: { createdAt: 'desc' },
                    take: 20,
                },
                assignmentLogs: {
                    orderBy: { createdAt: 'desc' },
                    take: 50,
                    include: {
                        assignedBy: {
                            select: {
                                name: true,
                                phone: true,
                            }
                        }
                    }
                }
            }
        })

        if (!booking) {
            return NextResponse.json(
                { success: false, error: 'Booking not found' },
                { status: 404 }
            )
        }

        // Category access check
        const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN'
        
        if (!isAdmin) {
            const categories = await getStaffCategories(user.userId)
            const categoryIds = categories.map(c => c.id)
            const bookingCategoryId = booking.service.subCategory.categoryId

            if (categoryIds.length > 0 && !categoryIds.includes(bookingCategoryId)) {
                return NextResponse.json(
                    { success: false, error: 'You do not have access to this booking' },
                    { status: 403 }
                )
            }
        }

        return NextResponse.json({
            success: true,
            data: booking,
        }, {
            headers: {
                'Cache-Control': 'no-store, must-revalidate',
            }
        })

    } catch (error) {
        console.error('❌ Ops booking detail error:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}