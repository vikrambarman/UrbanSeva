import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
    try {
        const admin = await getAdminUser(request)
        if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

        // Top services by bookings
        const topServices = await db.service.findMany({
            take: 10,
            orderBy: { bookings: { _count: 'desc' } },
            select: {
                id: true,
                name: true,
                image: true,
                basePrice: true,
                avgRating: true,
                _count: { select: { bookings: true, reviews: true } }
            }
        })

        // Category-wise distribution
        const categories = await db.category.findMany({
            include: {
                subCategories: {
                    include: {
                        services: {
                            select: { _count: { select: { bookings: true } } }
                        }
                    }
                }
            }
        })

        const categoryData = categories.map(cat => ({
            name: cat.name,
            bookings: cat.subCategories.reduce((sum, sub) =>
                sum + sub.services.reduce((s, svc) => s + svc._count.bookings, 0), 0
            )
        })).sort((a, b) => b.bookings - a.bookings)

        return NextResponse.json({
            success: true,
            data: {
                topServices,
                categoryData
            }
        })
    } catch (error) {
        console.error('Service Analytics Error:', error)
        return NextResponse.json({ success: false, error: 'Failed to fetch analytics' }, { status: 500 })
    }
}