// api/admin/staff/[id]/route.ts
// KYA: Individual staff member — update, delete, toggle active
// KYUN: Admin ko staff ko edit/delete karne ka option chahiye

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminUser } from '@/lib/auth'
import bcrypt from 'bcryptjs'

// ═══════════════════════════════════════════════════════════════
// GET — Get single staff member details
// ═══════════════════════════════════════════════════════════════
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

        const staff = await db.user.findFirst({
            where: { id, role: 'CALLING_TEAM' },
            select: {
                id: true,
                name: true,
                phone: true,
                email: true,
                avatar: true,
                isActive: true,
                isVerified: true,
                lastLoginAt: true,
                loginCount: true,
                createdAt: true,
                staffCategories: {
                    include: {
                        category: {
                            select: { id: true, name: true, slug: true }
                        }
                    }
                }
            }
        })

        if (!staff) {
            return NextResponse.json(
                { success: false, error: 'Staff member not found' },
                { status: 404 }
            )
        }

        return NextResponse.json({
            success: true,
            data: {
                ...staff,
                categories: staff.staffCategories.map(sc => sc.category),
                staffCategories: undefined,
            }
        })

    } catch (error) {
        console.error('❌ Admin staff get error:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}

// ═══════════════════════════════════════════════════════════════
// PUT — Update staff member
// ═══════════════════════════════════════════════════════════════
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
        const { name, email, password, isActive, categoryIds } = body

        // Verify staff exists
        const existingStaff = await db.user.findFirst({
            where: { id, role: 'CALLING_TEAM' }
        })

        if (!existingStaff) {
            return NextResponse.json(
                { success: false, error: 'Staff member not found' },
                { status: 404 }
            )
        }

        // Build update data
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const updateData: any = {}
        if (name !== undefined) updateData.name = name
        if (email !== undefined) updateData.email = email || null
        if (isActive !== undefined) updateData.isActive = isActive

        if (password) {
            if (password.length < 6) {
                return NextResponse.json(
                    { success: false, error: 'Password must be at least 6 characters' },
                    { status: 400 }
                )
            }
            updateData.password = await bcrypt.hash(password, 10)
        }

        // Update user
        await db.user.update({
            where: { id },
            data: updateData,
        })

        // ═══════════════════════════════════════════════════════
        // Update categories (delete old, add new)
        // ═══════════════════════════════════════════════════════
        if (categoryIds && Array.isArray(categoryIds)) {
            // Delete existing
            await db.staffCategory.deleteMany({
                where: { userId: id }
            })

            // Add new
            if (categoryIds.length > 0) {
                await db.staffCategory.createMany({
                    data: categoryIds.map((catId: string) => ({
                        userId: id,
                        categoryId: catId,
                        assignedBy: admin.userId,
                    }))
                })
            }
        }

        // Fetch updated user
        const updatedStaff = await db.user.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                phone: true,
                email: true,
                isActive: true,
                staffCategories: {
                    include: {
                        category: {
                            select: { id: true, name: true, slug: true }
                        }
                    }
                }
            }
        })

        return NextResponse.json({
            success: true,
            message: 'Staff member updated successfully',
            data: {
                ...updatedStaff,
                categories: updatedStaff?.staffCategories.map(sc => sc.category),
                staffCategories: undefined,
            }
        })

    } catch (error) {
        console.error('❌ Admin staff update error:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}

// ═══════════════════════════════════════════════════════════════
// DELETE — Delete staff member
// ═══════════════════════════════════════════════════════════════
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

        const { id } = await params

        // Verify staff exists
        const existingStaff = await db.user.findFirst({
            where: { id, role: 'CALLING_TEAM' }
        })

        if (!existingStaff) {
            return NextResponse.json(
                { success: false, error: 'Staff member not found' },
                { status: 404 }
            )
        }

        // Delete staff categories first (cascade should handle, but explicit)
        await db.staffCategory.deleteMany({
            where: { userId: id }
        })

        // Delete user
        await db.user.delete({
            where: { id }
        })

        return NextResponse.json({
            success: true,
            message: 'Staff member deleted successfully',
        })

    } catch (error) {
        console.error('❌ Admin staff delete error:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}