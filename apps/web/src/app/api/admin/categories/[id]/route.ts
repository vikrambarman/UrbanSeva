import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminUser } from '@/lib/auth'
import { getCallingTeamUser } from '@/lib/auth'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
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

        const { id } = await params

        const category = await db.category.findUnique({
            where: { id },
            include: {
                subCategories: {
                    include: {
                        services: { select: { id: true } }
                    }
                }
            }
        })

        if (!category) {
            return NextResponse.json(
                { success: false, error: 'Category not found' },
                { status: 404 }
            )
        }

        return NextResponse.json({
            success: true,
            data: category
        })

    } catch (error) {
        console.error('Get category error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch category' },
            { status: 500 }
        )
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
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

        const { id } = await params
        const body = await request.json()
        
        // ═══════════════════════════════════════════════════════════════
        // FIX: Added commissionType and commissionValue to destructuring
        // ═══════════════════════════════════════════════════════════════
        const { 
            gstEnabled, 
            gstPercentage, 
            name, 
            isActive, 
            image, 
            icon, 
            description, 
            sortOrder,
            commissionType,
            commissionValue
        } = body

        // Validate GST percentage if enabled
        if (gstEnabled && gstPercentage !== undefined) {
            const validRates = [0, 5, 12, 18, 28]
            if (!validRates.includes(gstPercentage)) {
                return NextResponse.json(
                    { success: false, error: 'Invalid GST rate. Must be 0, 5, 12, 18, or 28' },
                    { status: 400 }
                )
            }
        }

        // ═══════════════════════════════════════════════════════════════
        // FIX: Validate commission type if provided
        // ═══════════════════════════════════════════════════════════════
        if (commissionType !== undefined) {
            const validTypes = ['PERCENTAGE', 'FIXED']
            if (!validTypes.includes(commissionType)) {
                return NextResponse.json(
                    { success: false, error: 'Invalid commission type. Must be PERCENTAGE or FIXED' },
                    { status: 400 }
                )
            }
        }

        // Validate commission value if provided
        if (commissionValue !== undefined) {
            if (typeof commissionValue !== 'number' || commissionValue < 0) {
                return NextResponse.json(
                    { success: false, error: 'Commission value must be a non-negative number' },
                    { status: 400 }
                )
            }
        }

        // ✅ OPS can only update GST settings, Admin can update everything
        const updateData: any = {}
        
        if (admin) {
            // Admin can update all fields
            if (gstEnabled !== undefined) updateData.gstEnabled = gstEnabled
            if (gstPercentage !== undefined) updateData.gstPercentage = gstPercentage
            if (name !== undefined) updateData.name = name
            if (isActive !== undefined) updateData.isActive = isActive
            if (image !== undefined) updateData.image = image
            if (icon !== undefined) updateData.icon = icon
            if (description !== undefined) updateData.description = description
            if (sortOrder !== undefined) updateData.sortOrder = sortOrder
            
            // ═══════════════════════════════════════════════════════════════
            // NEW: Commission fields - Admin can update
            // ═══════════════════════════════════════════════════════════════
            if (commissionType !== undefined) updateData.commissionType = commissionType
            if (commissionValue !== undefined) updateData.commissionValue = commissionValue
            
        } else if (opsUser) {
            // OPS can only update GST settings (not commission)
            if (gstEnabled !== undefined) updateData.gstEnabled = gstEnabled
            if (gstPercentage !== undefined) updateData.gstPercentage = gstPercentage
        }

        const category = await db.category.update({
            where: { id },
            data: updateData
        })

        return NextResponse.json({
            success: true,
            message: 'Category updated successfully',
            data: category
        })

    } catch (error) {
        console.error('Update category error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to update category' },
            { status: 500 }
        )
    }
}