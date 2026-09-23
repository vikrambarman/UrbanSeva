import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const payload = verifyToken(token)
    if (!payload || payload.role !== 'PROVIDER') {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 })
    }

    // Get provider ID from user
    const provider = await db.provider.findUnique({
      where: { userId: payload.userId },
    })

    if (!provider) {
      return NextResponse.json({ success: false, error: 'Provider not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    const where: any = { providerId: provider.id }
    if (status && status !== 'all') {
      where.status = status
    }

    const bookings = await db.booking.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, phone: true },
        },
        service: true,
        address: true,
      },
      orderBy: { scheduledDate: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    })

    const total = await db.booking.count({ where })

    return NextResponse.json({
      success: true,
      data: {
        bookings,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
    })
  } catch (error) {
    console.error('Get Provider Bookings Error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch bookings' }, { status: 500 })
  }
}