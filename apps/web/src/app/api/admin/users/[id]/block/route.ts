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
        await db.user.update({ where: { id }, data: { isActive: false } })

        return NextResponse.json({ success: true, message: 'User blocked successfully' })
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed to block user' }, { status: 500 })
    }
}