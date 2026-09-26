import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getProviderUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
    try {
        const provider = await getProviderUser(request)
        if (!provider) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

        const profile = await db.provider.findUnique({
            where: { userId: provider.userId },
            select: {
                aadharNumber: true,
                panNumber: true,
                aadharImage: true,
                panImage: true,
                policeVerified: true,
                status: true,
            }
        })

        return NextResponse.json({ success: true, data: profile })
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed to fetch documents' }, { status: 500 })
    }
}

export async function PUT(request: NextRequest) {
    try {
        const provider = await getProviderUser(request)
        if (!provider) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

        const body = await request.json()

        const updated = await db.provider.update({
            where: { userId: provider.userId },
            data: {
                aadharNumber: body.aadharNumber,
                panNumber: body.panNumber,
                aadharImage: body.aadharImage,
                panImage: body.panImage,
                status: 'UNDER_REVIEW',
            }
        })

        return NextResponse.json({ success: true, data: updated })
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed to update documents' }, { status: 500 })
    }
}