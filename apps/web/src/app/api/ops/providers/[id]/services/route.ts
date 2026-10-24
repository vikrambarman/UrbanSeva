// apps/web/src/app/api/ops/providers/[id]/services/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCallingTeamUser } from '@/lib/auth'

// POST: Assign a service to provider
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCallingTeamUser(request)
        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const { id } = await params
        const body = await request.json()
        const { serviceId, customPrice, notes } = body

        if (!serviceId) {
            return NextResponse.json(
                { success: false, error: 'Service ID is required' },
                { status: 400 }
            )
        }

        // Check if provider exists
        const provider = await db.provider.findUnique({
            where: { id }
        })

        if (!provider) {
            return NextResponse.json(
                { success: false, error: 'Provider not found' },
                { status: 404 }
            )
        }

        // Check if service exists
        const service = await db.service.findUnique({
            where: { id: serviceId }
        })

        if (!service) {
            return NextResponse.json(
                { success: false, error: 'Service not found' },
                { status: 404 }
            )
        }

        // Check if already assigned
        const existingAssignment = await db.providerService.findUnique({
            where: {
                providerId_serviceId: {
                    providerId: id,
                    serviceId: serviceId
                }
            }
        })

        if (existingAssignment) {
            // If already exists, just update it (reactivate if inactive)
            const updated = await db.providerService.update({
                where: { id: existingAssignment.id },
                data: {
                    isActive: true,
                    customPrice: customPrice || null,
                    notes: notes || null,
                    assignedBy: user.userId, // ✅ FIX: user.id -> user.userId
                },
                include: {
                    service: {
                        include: {
                            subCategory: {
                                include: {
                                    category: {
                                        select: { name: true }
                                    }
                                }
                            }
                        }
                    }
                }
            })

            return NextResponse.json({
                success: true,
                message: 'Service updated successfully',
                data: {
                    id: updated.id,
                    serviceId: updated.serviceId,
                    name: updated.service.name,
                    image: updated.service.image,
                    category: updated.service.subCategory.category.name,
                    customPrice: updated.customPrice,
                    isActive: updated.isActive,
                }
            })
        }

        // Create new assignment
        const newAssignment = await db.providerService.create({
            data: {
                providerId: id,
                serviceId: serviceId,
                customPrice: customPrice || null,
                notes: notes || null,
                assignedBy: user.userId, // ✅ FIX: user.id -> user.userId
                isActive: true,
            },
            include: {
                service: {
                    include: {
                        subCategory: {
                            include: {
                                category: {
                                    select: { name: true }
                                }
                            }
                        }
                    }
                }
            }
        })

        return NextResponse.json({
            success: true,
            message: 'Service assigned successfully',
            data: {
                id: newAssignment.id,
                serviceId: newAssignment.serviceId,
                name: newAssignment.service.name,
                image: newAssignment.service.image,
                category: newAssignment.service.subCategory.category.name,
                customPrice: newAssignment.customPrice,
                isActive: newAssignment.isActive,
            }
        }, { status: 201 })

    } catch (error) {
        console.error('❌ Assign service to provider error:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}

// DELETE: Remove a service from provider
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCallingTeamUser(request)
        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const { id } = await params
        const { searchParams } = new URL(request.url)
        const serviceId = searchParams.get('serviceId')

        if (!serviceId) {
            return NextResponse.json(
                { success: false, error: 'Service ID is required' },
                { status: 400 }
            )
        }

        // Soft delete: Mark as inactive instead of hard delete
        const assignment = await db.providerService.findUnique({
            where: {
                providerId_serviceId: {
                    providerId: id,
                    serviceId: serviceId
                }
            }
        })

        if (!assignment) {
            return NextResponse.json(
                { success: false, error: 'Service assignment not found' },
                { status: 404 }
            )
        }

        await db.providerService.update({
            where: { id: assignment.id },
            data: { isActive: false }
        })

        return NextResponse.json({
            success: true,
            message: 'Service removed successfully'
        })

    } catch (error) {
        console.error(' Remove service from provider error:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}