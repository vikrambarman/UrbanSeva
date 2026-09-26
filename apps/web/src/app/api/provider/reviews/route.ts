import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getProviderUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
    try {
        const providerAuth = await getProviderUser(request)
        if (!providerAuth) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

        const provider = await db.provider.findUnique({ where: { userId: providerAuth.userId } })
        if (!provider) return NextResponse.json({ success: false, error: 'Provider not found' }, { status: 404 })

        const reviews = await db.review.findMany({
            where: { providerId: provider.id },
            orderBy: { createdAt: 'desc' },
            include: {
                user: { select: { name: true, avatar: true } },
                service: { select: { name: true } },
                booking: { select: { bookingNumber: true } }
            }
        })

        // Calculate stats
        const totalReviews = reviews.length
        const avgRating = totalReviews > 0 
            ? reviews.reduce((sum, r) => sum + r.overallRating, 0) / totalReviews 
            : 0

        const ratingBreakdown = [5, 4, 3, 2, 1].map(star => ({
            star,
            count: reviews.filter(r => Math.round(r.overallRating) === star).length,
            percentage: totalReviews > 0 
                ? (reviews.filter(r => Math.round(r.overallRating) === star).length / totalReviews) * 100 
                : 0
        }))

        return NextResponse.json({
            success: true,
            data: {
                reviews,
                stats: {
                    totalReviews,
                    avgRating: Math.round(avgRating * 10) / 10,
                    ratingBreakdown
                }
            }
        })
    } catch (error) {
        console.error('Provider Reviews Error:', error)
        return NextResponse.json({ success: false, error: 'Failed to fetch reviews' }, { status: 500 })
    }
}