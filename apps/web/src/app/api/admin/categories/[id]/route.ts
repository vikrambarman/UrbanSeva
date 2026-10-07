/**
 * WHAT: Admin API to get/update single category
 * WHY: Category edit page ke liye - especially GST settings update
 * NOTE: PUT request se GST enable/disable + percentage update hoga
 * FIX: Next.js 15 mein params Promise hota hai
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminUser } from '@/lib/auth'

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

        const category = await db.category.findUnique({
            where: { id },
            include: {
                subCategories: {
                    include: {
                        services: true,
                    },
                },
            },
        })

        if (!category) {
            return NextResponse.json(
                { success: false, error: 'Category not found' },
                { status: 404 }
            )
        }

        return NextResponse.json({
            success: true,
            data: category,
        })
    } catch (error) {
        console.error('Get Category Error:', error)
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
        const admin = await getAdminUser(request)
        if (!admin) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const { id } = await params
        const body = await request.json()
        const {
            name,
            image,
            icon,
            description,
            sortOrder,
            isActive,
            gstEnabled,
            gstPercentage,
        } = body

        // Validate GST percentage
        if (gstPercentage !== undefined) {
            const validRates = [0, 5, 12, 18, 28]
            if (!validRates.includes(gstPercentage)) {
                return NextResponse.json(
                    { success: false, error: 'Invalid GST percentage. Must be 0, 5, 12, 18, or 28' },
                    { status: 400 }
                )
            }
        }

        const category = await db.category.update({
            where: { id },
            data: {
                ...(name !== undefined && { name }),
                ...(image !== undefined && { image }),
                ...(icon !== undefined && { icon }),
                ...(description !== undefined && { description }),
                ...(sortOrder !== undefined && { sortOrder }),
                ...(isActive !== undefined && { isActive }),
                ...(gstEnabled !== undefined && { gstEnabled }),
                ...(gstPercentage !== undefined && { gstPercentage }),
            },
        })

        return NextResponse.json({
            success: true,
            message: 'Category updated successfully',
            data: category,
        })
    } catch (error) {
        console.error('Update Category Error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to update category' },
            { status: 500 }
        )
    }
}