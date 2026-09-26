import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminUser } from '@/lib/auth'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const admin = await getAdminUser(request)
        if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

        const { id } = await params
        const body = await request.json()

        const banner = await db.banner.update({
            where: { id },
            data: {
                title: body.title,
                image: body.image,
                link: body.link,
                position: body.position,
                sortOrder: body.sortOrder,
                isActive: body.isActive,
                startDate: body.startDate ? new Date(body.startDate) : null,
                endDate: body.endDate ? new Date(body.endDate) : null,
            }
        })
        return NextResponse.json({ success: true, data: banner })
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed to update banner' }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const admin = await getAdminUser(request)
        if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

        const { id } = await params
        await db.banner.delete({ where: { id } })
        return NextResponse.json({ success: true, message: 'Banner deleted' })
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed to delete banner' }, { status: 500 })
    }
}