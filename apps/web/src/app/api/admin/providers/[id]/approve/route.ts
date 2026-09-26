import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminUser } from '@/lib/auth'

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const admin = await getAdminUser(request)
        if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

        const { id } = await params
        await db.provider.update({
            where: { id },
            data: { status: 'APPROVED' }
        })

        return NextResponse.json({ success: true, message: 'Provider approved successfully' })
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed to approve provider' }, { status: 500 })
    }
}