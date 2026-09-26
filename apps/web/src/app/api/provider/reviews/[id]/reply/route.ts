import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getProviderUser } from '@/lib/auth'

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const providerAuth = await getProviderUser(request)
        if (!providerAuth) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

        const { id } = await params
        const body = await request.json()

        if (!body.reply) {
            return NextResponse.json({ success: false, error: 'Reply text is required' }, { status: 400 })
        }

        const updatedReview = await db.review.update({
            where: { id },
            data: { providerReply: body.reply }
        })

        return NextResponse.json({ success: true, data: updatedReview })
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed to reply to review' }, { status: 500 })
    }
}