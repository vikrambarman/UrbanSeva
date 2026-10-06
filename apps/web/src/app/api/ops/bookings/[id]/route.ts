// api/ops/bookings/[id]/route.ts
// KYA: Single booking detail — ops portal ke liye
// KYUN: Booking detail page pe sab info chahiye — customer, service, provider,
//       address, payment, activity logs — sab ek saath

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
                        bio: true,
                        experience: true,
                        avgRating: true,
                        user: {
                            select: {
                                name: true,
                                phone: true,
                                email: true,
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
                // ═══════════════════════════════════════════════════════════════
                // NEW: Assignment logs — kaunsa staff ne kya kiya
                // ═══════════════════════════════════════════════════════════════
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

        // ═══════════════════════════════════════════════════════════════
        // Category access check — staff sirf apni categories ki booking dekhe
        // ═══════════════════════════════════════════════════════════════
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
        })

    } catch (error) {
        console.error('❌ Ops booking detail error:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}