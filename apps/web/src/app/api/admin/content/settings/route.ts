import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
    try {
        const admin = await getAdminUser(request)
        if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

        const settings = await db.appSetting.findMany({
            where: { key: { in: ['TERMS_AND_CONDITIONS', 'PRIVACY_POLICY', 'ABOUT_US'] } }
        })
        
        const formatted = settings.reduce((acc, curr) => {
            acc[curr.key] = curr.value
            return acc
        }, {} as Record<string, string>)

        return NextResponse.json({ success: true, data: formatted })
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed to fetch settings' }, { status: 500 })
    }
}

export async function PUT(request: NextRequest) {
    try {
        const admin = await getAdminUser(request)
        if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

        const body = await request.json()

        // Upsert settings
        for (const [key, value] of Object.entries(body)) {
            await db.appSetting.upsert({
                where: { key },
                update: { value: value as string },
                create: { key, value: value as string, description: key.replace(/_/g, ' ') }
            })
        }

        return NextResponse.json({ success: true, message: 'Settings updated successfully' })
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed to update settings' }, { status: 500 })
    }
}