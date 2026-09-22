import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET: Get all providers assigned to a service
export async function GET(
  request: Request,
  { params }: { params: Promise<{ serviceId: string }> }
) {
  try {
    const { serviceId } = await params

    const providerServices = await db.providerService.findMany({
      where: { serviceId },
      include: {
        provider: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                phone: true,
                avatar: true,
              },
            },
          },
        },
      },
      orderBy: { assignedAt: 'desc' },
    })

    return NextResponse.json({ success: true, data: providerServices })
  } catch (error) {
    console.error('Error fetching providers:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST: Assign provider to service
export async function POST(
  request: Request,
  { params }: { params: Promise<{ serviceId: string }> }
) {
  try {
    const { serviceId } = await params
    const body = await request.json()
    const { providerId, customPrice, notes, assignedBy } = body

    if (!providerId) {
      return NextResponse.json(
        { success: false, error: 'Provider ID is required' },
        { status: 400 }
      )
    }

    // Check if already assigned
    const existing = await db.providerService.findUnique({
      where: {
        providerId_serviceId: { providerId, serviceId },
      },
    })

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Provider already assigned to this service' },
        { status: 400 }
      )
    }

    const providerService = await db.providerService.create({
      data: {
        providerId,
        serviceId,
        customPrice,
        notes,
        assignedBy,
        isActive: true,
      },
      include: {
        provider: {
          include: {
            user: {
              select: { id: true, name: true, phone: true, avatar: true },
            },
          },
        },
      },
    })

    return NextResponse.json({ success: true, data: providerService })
  } catch (error) {
    console.error('Error assigning provider:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE: Remove provider from service
export async function DELETE(request: Request) {
  try {
    const body = await request.json()
    const { providerId, serviceId } = body

    if (!providerId || !serviceId) {
      return NextResponse.json(
        { success: false, error: 'Provider ID and Service ID are required' },
        { status: 400 }
      )
    }

    await db.providerService.delete({
      where: {
        providerId_serviceId: { providerId, serviceId },
      },
    })

    return NextResponse.json({ success: true, message: 'Provider removed from service' })
  } catch (error) {
    console.error('Error removing provider:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}