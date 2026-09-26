import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminUser } from '@/lib/auth'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const admin = await getAdminUser(request)
        if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        const { id } = await params
        await db.providerInquiry.update({
            where: { id },
            data: { status: 'REJECTED', notes: `Rejected by admin ${admin.phone} on ${new Date().toISOString()}` }
        })
        return NextResponse.json({ success: true })
    } catch (e) {
        return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 })
    }
}