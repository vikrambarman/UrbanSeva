import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminUser } from '@/lib/auth'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }  // ✅ serviceId → id
) {
    try {
        const admin = await getAdminUser(request)
        if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

        const { id } = await params  // ✅ serviceId → id

        const providerServices = await db.providerService.findMany({
            where: { serviceId: id },  // ✅ yahan serviceId model ka field hai, wo sahi hai
            include: {
                provider: {
                    include: {
                        user: { select: { id: true, name: true, phone: true, avatar: true } }
                    }
                }
            }
        })

        return NextResponse.json({ success: true, data: providerServices })
    } catch (error) {
        console.error('Service Providers GET Error:', error)
        return NextResponse.json({ success: false, error: 'Failed to fetch providers' }, { status: 500 })
    }
}