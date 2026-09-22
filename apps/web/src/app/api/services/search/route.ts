import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!query.trim()) {
      return NextResponse.json({ success: true, data: [] })
    }

    const services = await db.service.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
      },
      include: {
        subCategory: {
          include: {
            category: true,
          },
        },
        pricingTiers: { orderBy: { sortOrder: 'asc' } },
      },
      take: limit,
      orderBy: { avgRating: 'desc' },
    })

    return NextResponse.json({ success: true, data: services })
  } catch (error) {
    console.error('Error searching services:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}