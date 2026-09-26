import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminUser } from '@/lib/auth'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const admin = await getAdminUser(request)
        if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

        const { id } = await params
        const body = await request.json()

        const faq = await db.fAQ.update({
            where: { id },
            data: {
                question: body.question,
                answer: body.answer,
                category: body.category,
                sortOrder: body.sortOrder,
                isActive: body.isActive,
            }
        })
        return NextResponse.json({ success: true, data: faq })
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed to update FAQ' }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const admin = await getAdminUser(request)
        if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

        const { id } = await params
        await db.fAQ.delete({ where: { id } })
        return NextResponse.json({ success: true, message: 'FAQ deleted' })
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed to delete FAQ' }, { status: 500 })
    }
}