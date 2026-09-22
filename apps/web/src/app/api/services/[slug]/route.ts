import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    const service = await db.service.findUnique({
      where: { slug, isActive: true },
      include: {
        subCategory: {
          include: {
            category: true,
          },
        },
        inclusions: { orderBy: { sortOrder: 'asc' } },
        exclusions: { orderBy: { sortOrder: 'asc' } },
        pricingTiers: { orderBy: { sortOrder: 'asc' } },
        addOns: true,
        faqs: { orderBy: { sortOrder: 'asc' } },
        providerServices: {
          where: { isActive: true },
          include: {
            provider: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    avatar: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!service) {
      return NextResponse.json(
        { success: false, error: 'Service not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: service })
  } catch (error) {
    console.error('Error fetching service:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}