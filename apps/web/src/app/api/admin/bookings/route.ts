import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
    try {
        const admin = await getAdminUser(request)
        if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '10')
        const search = searchParams.get('search') || ''
        const status = searchParams.get('status')

        const where: any = {}
        if (search) {
            where.OR = [
                { bookingNumber: { contains: search } },
                { user: { name: { contains: search, mode: 'insensitive' } } },
                { user: { phone: { contains: search } } },
            ]
        }
        if (status && status !== 'ALL') where.status = status

        const [bookings, total] = await Promise.all([
            db.booking.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: { select: { name: true, phone: true } },
                    service: { select: { name: true, image: true } },
                    provider: { select: { user: { select: { name: true, phone: true } } } },
                    address: { select: { fullAddress: true, area: true } }
                }
            }),
            db.booking.count({ where })
        ])

        return NextResponse.json({
            success: true,
            data: { bookings, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } }
        })
    } catch (error) {
        console.error('Admin Bookings GET Error:', error)
        return NextResponse.json({ success: false, error: 'Failed to fetch bookings' }, { status: 500 })
    }
}

// Manual Booking Creation (Admin se direct booking)
export async function POST(request: NextRequest) {
    try {
        const admin = await getAdminUser(request)
        if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

        const body = await request.json()
        const bookingNumber = `BK${Date.now().toString().slice(-8)}`

        const newBooking = await db.booking.create({
            data: {
                bookingNumber,
                userId: body.userId,
                serviceId: body.serviceId,
                providerId: body.providerId || null,
                addressId: body.addressId,
                scheduledDate: new Date(body.scheduledDate),
                scheduledTime: body.scheduledTime,
                baseAmount: body.baseAmount,
                addOnAmount: body.addOnAmount || 0,
                discountAmount: body.discountAmount || 0,
                totalAmount: body.totalAmount,
                paymentStatus: 'PAID', // Manual bookings considered paid/cash
                paymentMethod: body.paymentMethod || 'CASH',
                status: body.providerId ? 'PROVIDER_ASSIGNED' : 'PENDING',
                specialInstructions: body.specialInstructions,
            }
        })

        return NextResponse.json({ success: true, data: newBooking })
    } catch (error) {
        console.error('Manual Booking Error:', error)
        return NextResponse.json({ success: false, error: 'Failed to create manual booking' }, { status: 500 })
    }
}