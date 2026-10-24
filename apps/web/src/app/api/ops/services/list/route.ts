// apps/web/src/app/api/ops/services/list/route.ts
// CHANGE: OPS team ke liye saare categories, subcategories aur services fetch karne ka route
// WHY: Provider ko service assign karte waqt category-wise services dikhane ke liye

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCallingTeamUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
    try {
        const user = await getCallingTeamUser(request)
        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const { searchParams } = new URL(request.url)
        const search = searchParams.get('search') || ''

        // Fetch all active categories with their subcategories and services
        const categories = await db.category.findMany({
            where: {
                isActive: true,
                ...(search ? {
                    OR: [
                        { name: { contains: search, mode: 'insensitive' } },
                        { subCategories: {
                            some: {
                                OR: [
                                    { name: { contains: search, mode: 'insensitive' } },
                                    { services: {
                                        some: {
                                            name: { contains: search, mode: 'insensitive' }
                                        }
                                    }}
                                ]
                            }
                        }}
                    ]
                } : {})
            },
            select: {
                id: true,
                name: true,
                slug: true,
                subCategories: {
                    where: { isActive: true },
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        services: {
                            where: { isActive: true },
                            select: {
                                id: true,
                                name: true,
                                slug: true,
                                basePrice: true,
                                image: true,
                                priceType: true,
                            },
                            orderBy: { name: 'asc' }
                        }
                    },
                    orderBy: { sortOrder: 'asc' }
                }
            },
            orderBy: { sortOrder: 'asc' }
        })

        // Format for easier frontend consumption
        const formattedCategories = categories.map(cat => ({
            id: cat.id,
            name: cat.name,
            slug: cat.slug,
            subCategories: cat.subCategories.map(sub => ({
                id: sub.id,
                name: sub.name,
                slug: sub.slug,
                services: sub.services.map(svc => ({
                    id: svc.id,
                    name: svc.name,
                    slug: svc.slug,
                    basePrice: svc.basePrice,
                    image: svc.image,
                    priceType: svc.priceType,
                }))
            }))
        }))

        return NextResponse.json({
            success: true,
            data: formattedCategories
        }, {
            headers: {
                'Cache-Control': 'no-store, must-revalidate',
            }
        })

    } catch (error) {
        console.error('❌ Ops services list error:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}