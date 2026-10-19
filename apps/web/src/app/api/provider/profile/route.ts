// apps/web/src/app/api/provider/profile/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getProviderUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
    try {
        const provider = await getProviderUser(request)
        if (!provider) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

        const profile = await db.provider.findUnique({
            where: { userId: provider.userId },
            include: {
                user: { select: { name: true, phone: true, email: true, avatar: true } },
                services: { include: { service: { select: { name: true, image: true } } } },
                availability: { orderBy: { dayOfWeek: 'asc' } }
            }
        })

        if (!profile) return NextResponse.json({ success: false, error: 'Provider profile not found' }, { status: 404 })
        return NextResponse.json({ success: true, data: profile })
    } catch (error) {
        console.error('Provider Profile GET Error:', error)
        return NextResponse.json({ success: false, error: 'Failed to fetch profile' }, { status: 500 })
    }
}

export async function PUT(request: NextRequest) {
    try {
        const provider = await getProviderUser(request)
        if (!provider) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

        const body = await request.json()

        if (body.name || body.email) {
            await db.user.update({
                where: { id: provider.userId },
                data: { name: body.name, email: body.email, avatar: body.avatar }
            })
        }

        const updatedProvider = await db.provider.update({
            where: { userId: provider.userId },
            data: {
                bio: body.bio,
                experience: body.experience ? parseInt(body.experience) : undefined,
                isAvailable: body.isAvailable,
                serviceAreas: body.serviceAreas || [],
            }
        })

        return NextResponse.json({ success: true, data: updatedProvider })
    } catch (error) {
        console.error('Provider Profile PUT Error:', error)
        return NextResponse.json({ success: false, error: 'Failed to update profile' }, { status: 500 })
    }
}