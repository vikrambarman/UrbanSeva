import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminUser } from '@/lib/auth'

// GET: User Detail
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const admin = await getAdminUser(request)
        if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

        const { id } = await params
        const user = await db.user.findUnique({
            where: { id },
            include: {
                addresses: true,
                bookings: {
                    take: 5,
                    orderBy: { createdAt: 'desc' },
                    include: { service: { select: { name: true } } }
                },
                reviews: {
                    take: 5,
                    orderBy: { createdAt: 'desc' },
                    include: { service: { select: { name: true } } }
                }
            }
        })

        if (!user) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })

        return NextResponse.json({ success: true, data: user })
    } catch (error) {
        console.error('Admin User GET Error:', error)
        return NextResponse.json({ success: false, error: 'Failed to fetch user' }, { status: 500 })
    }
}

// PUT: Update User
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const admin = await getAdminUser(request)
        if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

        const { id } = await params
        const body = await request.json()

        const updatedUser = await db.user.update({
            where: { id },
            data: {
                name: body.name,
                email: body.email,
                role: body.role,
                isActive: body.isActive,
                isVerified: body.isVerified,
            }
        })

        return NextResponse.json({ success: true, data: updatedUser })
    } catch (error) {
        console.error('Admin User PUT Error:', error)
        return NextResponse.json({ success: false, error: 'Failed to update user' }, { status: 500 })
    }
}

// DELETE: Soft Delete User (Deactivate)
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const admin = await getAdminUser(request)
        if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

        const { id } = await params
        
        // Soft delete to maintain backward compatibility and prevent DB cascade errors
        await db.user.update({
            where: { id },
            data: { isActive: false }
        })

        return NextResponse.json({ success: true, message: 'User deactivated successfully' })
    } catch (error) {
        console.error('Admin User DELETE Error:', error)
        return NextResponse.json({ success: false, error: 'Failed to delete user' }, { status: 500 })
    }
}