import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
    try {
        const admin = await getAdminUser(request)
        if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

        const faqs = await db.fAQ.findMany({ orderBy: { sortOrder: 'asc' } }) // Prisma capitalizes model names like FAQ -> fAQ
        return NextResponse.json({ success: true, data: faqs })
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed to fetch FAQs' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const admin = await getAdminUser(request)
        if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

        const body = await request.json()
        const faq = await db.fAQ.create({
            data: {
                question: body.question,
                answer: body.answer,
                category: body.category,
                sortOrder: body.sortOrder || 0,
                isActive: body.isActive ?? true,
            }
        })
        return NextResponse.json({ success: true, data: faq })
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed to create FAQ' }, { status: 500 })
    }
}