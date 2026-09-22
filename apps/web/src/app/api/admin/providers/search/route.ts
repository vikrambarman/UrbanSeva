import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''

    if (!query.trim()) {
      return NextResponse.json({ success: true, data: [] })
    }

    const providers = await db.provider.findMany({
      where: {
        status: 'APPROVED',
        user: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { phone: { contains: query } },
          ],
        },
      },
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
      take: 10,
    })

    return NextResponse.json({ success: true, data: providers })
  } catch (error) {
    console.error('Error searching providers:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}