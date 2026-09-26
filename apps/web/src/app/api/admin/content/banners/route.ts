import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
    try {
        const admin = await getAdminUser(request)
        if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

        const banners = await db.banner.findMany({ orderBy: { sortOrder: 'asc' } })
        return NextResponse.json({ success: true, data: banners })
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed to fetch banners' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const admin = await getAdminUser(request)
        if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

        const body = await request.json()
        const banner = await db.banner.create({
            data: {
                title: body.title,
                image: body.image,
                link: body.link,
                position: body.position || 'HOME_TOP',
                sortOrder: body.sortOrder || 0,
                isActive: body.isActive ?? true,
                startDate: body.startDate ? new Date(body.startDate) : null,
                endDate: body.endDate ? new Date(body.endDate) : null,
            }
        })
        return NextResponse.json({ success: true, data: banner })
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed to create banner' }, { status: 500 })
    }
}