// apps/web/src/app/api/provider/lists/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization')
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        const token = authHeader.substring(7)
        const payload = verifyToken(token)
        if (!payload) {
            return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const subCategoryId = searchParams.get('subCategoryId')

        // ✅ FIX: isActive doesn't exist on Provider. Using status + isAvailable instead.
        const where: Record<string, any> = {
            status: 'APPROVED',
            isAvailable: true,
        }

        // ⚠️ TEMP FIX: Filtering via `services` relation (junction table) -> `service.subCategoryId`
        // Please confirm exact schema so this filter is 100% accurate.
        if (subCategoryId) {
            where.services = {
                some: {
                    service: {
                        subCategoryId: subCategoryId
                    }
                }
            }
        }

        const providers = await db.provider.findMany({
            where,
            select: {
                id: true,
                avgRating: true,
                totalJobs: true,
                user: {
                    select: {
                        name: true,
                        phone: true,
                    }
                },
                services: {
                    select: {
                        service: {
                            select: { id: true, name: true }
                        }
                    }
                }
            },
            orderBy: { avgRating: 'desc' },
        })

        return NextResponse.json({
            success: true,
            data: providers
        })
    } catch (error) {
        console.error('Providers List Error:', error)
        return NextResponse.json({ success: false, error: 'Failed to fetch providers' }, { status: 500 })
    }
}