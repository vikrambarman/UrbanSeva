import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 })
    }

    const booking = await db.booking.findUnique({
      where: { id },
      include: {
        service: {
          include: {
            subCategory: { include: { category: true } },
            inclusions: true,
            pricingTiers: { orderBy: { sortOrder: 'asc' } },
          },
        },
        address: true,
        provider: {
          include: {
            user: {
              select: { id: true, name: true, phone: true, avatar: true },
            },
          },
        },
        payment: true,
        statusHistory: {
          orderBy: { createdAt: 'desc' },
        },
        review: true,
      },
    })

    if (!booking) {
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 })
    }

    // Check if user has access
    if (booking.userId !== payload.userId && payload.role !== 'ADMIN' && payload.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 })
    }

    return NextResponse.json({ success: true, data: booking })
  } catch (error) {
    console.error('Get Booking Error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch booking' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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
    const { status, cancelReason } = body

    const booking = await db.booking.findUnique({ where: { id } })
    
    if (!booking) {
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 })
    }

    // Check permissions
    const isOwner = booking.userId === payload.userId
    const isAdmin = payload.role === 'ADMIN' || payload.role === 'SUPER_ADMIN'
    
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 })
    }

    // Update booking
    const updatedBooking = await db.booking.update({
      where: { id },
      data: {
        status,
        ...(cancelReason && { cancelReason, cancelledAt: new Date() }),
      },
    })

    // Create status history
    await db.bookingStatusHistory.create({
      data: {
        bookingId: id,
        status,
        note: cancelReason || `Status updated to ${status}`,
        changedBy: payload.userId,
      },
    })

    return NextResponse.json({ success: true, data: updatedBooking })
  } catch (error) {
    console.error('Update Booking Error:', error)
    return NextResponse.json({ success: false, error: 'Failed to update booking' }, { status: 500 })
  }
}