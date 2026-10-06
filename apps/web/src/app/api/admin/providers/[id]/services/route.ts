// apps/web/src/app/api/admin/providers/[id]/services/route.ts
// KYA: Provider ki services manage karna — add, remove, update custom price
// KYUN: Provider detail page se admin services add/remove kar sake

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminUser } from '@/lib/auth'

// GET — Get provider's services
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const admin = await getAdminUser(request)
        if (!admin) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const { id } = await params

        const providerServices = await db.providerService.findMany({
            where: { providerId: id },
            include: {
                service: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        image: true,
                        basePrice: true,
                        subCategory: {
                            select: {
                                name: true,
                                category: {
                                    select: {
                                        name: true,
                                    }
                                }
                            }
                        }
                    }
                }
            },
            orderBy: { assignedAt: 'desc' }
        })

        return NextResponse.json({
            success: true,
            data: providerServices
        })

    } catch (error) {
        console.error('Get Provider Services Error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch services' },
            { status: 500 }
        )
    }
}

// POST — Add services to provider
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const admin = await getAdminUser(request)
        if (!admin) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const { id: providerId } = await params
        const body = await request.json()
        const { serviceIds, customPrice } = body

        if (!serviceIds || !Array.isArray(serviceIds) || serviceIds.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Service IDs required' },
                { status: 400 }
            )
        }

        // Verify provider exists
        const provider = await db.provider.findUnique({
            where: { id: providerId }
        })

        if (!provider) {
            return NextResponse.json(
                { success: false, error: 'Provider not found' },
                { status: 404 }
            )
        }

        // Create ProviderService entries (skip if already exists)
        const created = await db.providerService.createMany({
            data: serviceIds.map((serviceId: string) => ({
                providerId,
                serviceId,
                customPrice: customPrice || null,
                assignedBy: admin.userId,
                isActive: true,
            })),
            skipDuplicates: true
        })

        return NextResponse.json({
            success: true,
            message: `${created.count} service(s) added to provider`,
            data: { count: created.count }
        })

    } catch (error) {
        console.error('Add Provider Services Error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to add services' },
            { status: 500 }
        )
    }
}

// DELETE — Remove service from provider
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const admin = await getAdminUser(request)
        if (!admin) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const { id: providerId } = await params
        const { searchParams } = new URL(request.url)
        const serviceId = searchParams.get('serviceId')

        if (!serviceId) {
            return NextResponse.json(
                { success: false, error: 'Service ID required' },
                { status: 400 }
            )
        }

        await db.providerService.deleteMany({
            where: {
                providerId,
                serviceId
            }
        })

        return NextResponse.json({
            success: true,
            message: 'Service removed from provider'
        })

    } catch (error) {
        console.error('Remove Provider Service Error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to remove service' },
            { status: 500 }
        )
    }
}

// PUT — Update custom price for a service
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const admin = await getAdminUser(request)
        if (!admin) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const { id: providerId } = await params
        const body = await request.json()
        const { serviceId, customPrice } = body

        if (!serviceId) {
            return NextResponse.json(
                { success: false, error: 'Service ID required' },
                { status: 400 }
            )
        }

        const updated = await db.providerService.updateMany({
            where: {
                providerId,
                serviceId
            },
            data: {
                customPrice: customPrice
            }
        })

        return NextResponse.json({
            success: true,
            message: 'Custom price updated',
            data: { count: updated.count }
        })

    } catch (error) {
        console.error('Update Provider Service Error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to update service' },
            { status: 500 }
        )
    }
}