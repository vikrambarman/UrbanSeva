import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const providerId = searchParams.get('providerId')

    if (!providerId) {
      return NextResponse.json(
        { success: false, error: 'Provider ID is required' },
        { status: 400 }
      )
    }

    const providerServices = await db.providerService.findMany({
      where: { providerId, isActive: true },
      include: {
        service: {
          include: {
            subCategory: {
              include: {
                category: true,
              },
            },
            pricingTiers: { orderBy: { sortOrder: 'asc' } },
          },
        },
      },
      orderBy: { assignedAt: 'desc' },
    })

    return NextResponse.json({ success: true, data: providerServices })
  } catch (error) {
    console.error('Error fetching provider services:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}