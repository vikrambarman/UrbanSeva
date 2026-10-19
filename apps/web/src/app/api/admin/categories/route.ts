import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminUser } from '@/lib/auth'
import { getCallingTeamUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
    try {
        // ✅ Support both Admin and OPS users
        const admin = await getAdminUser(request)
        const opsUser = await getCallingTeamUser(request)
        
        if (!admin && !opsUser) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const categories = await db.category.findMany({
            include: {
                subCategories: {
                    include: {
                        services: {
                            select: { id: true }
                        }
                    }
                }
            },
            orderBy: { sortOrder: 'asc' }
        })

        return NextResponse.json({
            success: true,
            data: categories
        })

    } catch (error) {
        console.error('Fetch categories error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch categories' },
            { status: 500 }
        )
    }
}