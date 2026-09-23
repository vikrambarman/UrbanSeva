import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

export async function POST(request: Request) {
    try {
        const authHeader = request.headers.get('authorization')
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        const token = authHeader.substring(7)
        const payload = verifyToken(token)
        if (!payload) {
            return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 })
        }

        const body = await request.json()
        const { bookingId, overallRating, punctualityRating, qualityRating, behaviourRating, valueRating, comment } = body

        // Check if booking exists and is completed
        const booking = await db.booking.findUnique({
            where: { id: bookingId },
            include: { review: true },
        })

        if (!booking) {
            return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 })
        }

        if (booking.status !== 'SERVICE_COMPLETED') {
            return NextResponse.json({ success: false, error: 'Can only review completed bookings' }, { status: 400 })
        }

        if (booking.review) {
            return NextResponse.json({ success: false, error: 'Review already submitted' }, { status: 400 })
        }

        // Create review
        const review = await db.review.create({
            data: {
                bookingId,
                userId: payload.userId,
                serviceId: booking.serviceId,
                providerId: booking.providerId,
                overallRating,
                punctualityRating,
                qualityRating,
                behaviourRating,
                valueRating,
                comment,
            },
        })

        // Update service rating
        const allReviews = await db.review.findMany({
            where: { serviceId: booking.serviceId },
        })

        const avgRating = allReviews.reduce((sum, r) => sum + r.overallRating, 0) / allReviews.length

        await db.service.update({
            where: { id: booking.serviceId },
            data: {
                avgRating,
                totalReviews: allReviews.length,
            },
        })

        return NextResponse.json({ success: true, data: review })
    } catch (error) {
        console.error('Submit Review Error:', error)
        return NextResponse.json({ success: false, error: 'Failed to submit review' }, { status: 500 })
    }
}