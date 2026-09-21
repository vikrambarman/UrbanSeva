import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const trending = searchParams.get('trending')
    const featured = searchParams.get('featured')
    const category = searchParams.get('category')
    const subcategory = searchParams.get('subcategory')
    const limit = parseInt(searchParams.get('limit') || '10')

    const where: Record<string, unknown> = { isActive: true }

    if (trending === 'true') where.isTrending = true
    if (featured === 'true') where.isFeatured = true

    if (category || subcategory) {
      where.subCategory = {
        ...(subcategory ? { slug: subcategory } : {}),
        ...(category
          ? { category: { slug: category } }
          : {}),
      }
    }

    const services = await db.service.findMany({
      where,
      include: {
        subCategory: {
          include: { category: true },
        },
      },
      take: limit,
      orderBy: { avgRating: 'desc' },
    })

    return NextResponse.json({ success: true, data: services })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch services' },
      { status: 500 }
    )
  }
}
