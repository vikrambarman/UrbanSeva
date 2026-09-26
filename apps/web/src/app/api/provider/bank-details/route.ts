import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getProviderUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
    try {
        const provider = await getProviderUser(request)
        if (!provider) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

        const profile = await db.provider.findUnique({
            where: { userId: provider.userId },
            select: { bankAccount: true, bankIFSC: true, bankName: true, upiId: true }
        })

        return NextResponse.json({ success: true, data: profile })
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed to fetch bank details' }, { status: 500 })
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
                bankAccount: body.bankAccount,
                bankIFSC: body.bankIFSC,
                bankName: body.bankName,
                upiId: body.upiId,
            }
        })

        return NextResponse.json({ success: true, data: updated })
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed to update bank details' }, { status: 500 })
    }
}