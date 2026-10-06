// apps/web/src/app/api/admin/staff/route.ts
// CHANGE: Added debug logging for Prisma query and result count
// CHANGE: Added a check to find misconfigured staff (role=CUSTOMER but has categories)
// WHY: Initial load par list empty aa rahi thi. Ye logs check karenge ki kahin Prisma cache 
//      ki wajah se users abhi bhi 'CUSTOMER' role ke saath toh nahi save ho rahe.

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminUser } from '@/lib/auth'
import bcrypt from 'bcryptjs'

// ═══════════════════════════════════════════════════════════════
// GET — List all calling team members
// ═══════════════════════════════════════════════════════════════
export async function GET(request: NextRequest) {
    try {
        const admin = await getAdminUser(request)
        if (!admin) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '20')
        const search = searchParams.get('search') || ''

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const where: any = {
            role: 'CALLING_TEAM',
        }

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
            ]
        }

        console.log('🔍 Staff Query Where Clause:', JSON.stringify(where, null, 2))

        const [staff, total] = await Promise.all([
            db.user.findMany({
                where,
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
                                select: {
                                    id: true,
                                    name: true,
                                    slug: true,
                                }
                            }
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            db.user.count({ where }),
        ])

        console.log('✅ Staff Query Result Count:', total)

        // ═══════════════════════════════════════════════════════
        // DEBUG: Check if staff was saved with wrong role due to Prisma cache
        // ═══════════════════════════════════════════════════════
        if (total === 0 && !search) {
            const misconfiguredStaff = await db.user.findMany({
                where: {
                    role: 'CUSTOMER',
                    staffCategories: { some: {} } // Has categories but role is CUSTOMER
                },
                select: { id: true, name: true, phone: true, role: true }
            })
            
            if (misconfiguredStaff.length > 0) {
                console.warn('⚠️ CRITICAL: Found misconfigured staff (role=CUSTOMER but has categories):', misconfiguredStaff)
                console.warn('⚠️ Please update their role to CALLING_TEAM in DB or Prisma Studio.')
            }
        }

        return NextResponse.json({
            success: true,
            data: {
                staff: staff.map(s => ({
                    ...s,
                    categories: s.staffCategories.map(sc => sc.category),
                    staffCategories: undefined, // remove raw relation
                })),
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                }
            }
        })

    } catch (error) {
        console.error('❌ Admin staff list error:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}

// ═══════════════════════════════════════════════════════════════
// POST — Create new calling team member
// ═══════════════════════════════════════════════════════════════
export async function POST(request: NextRequest) {
    try {
        const admin = await getAdminUser(request)
        if (!admin) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const body = await request.json()
        const { name, phone, email, password, categoryIds } = body

        // ═══════════════════════════════════════════════════════
        // Validation
        // ═══════════════════════════════════════════════════════
        if (!name || !phone || !password) {
            return NextResponse.json(
                { success: false, error: 'Name, phone, and password are required' },
                { status: 400 }
            )
        }

        const cleanPhone = phone.replace(/\D/g, '')
        if (cleanPhone.length !== 10) {
            return NextResponse.json(
                { success: false, error: 'Invalid phone number (must be 10 digits)' },
                { status: 400 }
            )
        }

        if (password.length < 6) {
            return NextResponse.json(
                { success: false, error: 'Password must be at least 6 characters' },
                { status: 400 }
            )
        }

        // Check if phone already exists
        const existingUser = await db.user.findUnique({
            where: { phone: cleanPhone }
        })

        if (existingUser) {
            return NextResponse.json(
                { success: false, error: 'Phone number already registered' },
                { status: 409 }
            )
        }

        // ═══════════════════════════════════════════════════════
        // Hash password
        // ═══════════════════════════════════════════════════════
        const hashedPassword = await bcrypt.hash(password, 10)

        // ═══════════════════════════════════════════════════════
        // Create user
        // ═══════════════════════════════════════════════════════
        const user = await db.user.create({
            data: {
                name,
                phone: cleanPhone,
                email: email || null,
                password: hashedPassword,
                role: 'CALLING_TEAM',
                isActive: true,
                isVerified: true,
            }
        })

        console.log('✅ Created staff user with role:', user.role)

        // ═══════════════════════════════════════════════════════
        // Assign categories
        // ═══════════════════════════════════════════════════════
        if (categoryIds && Array.isArray(categoryIds) && categoryIds.length > 0) {
            await db.staffCategory.createMany({
                data: categoryIds.map((catId: string) => ({
                    userId: user.id,
                    categoryId: catId,
                    assignedBy: admin.userId,
                }))
            })
        }

        // ═══════════════════════════════════════════════════════
        // Fetch created user with categories
        // ═══════════════════════════════════════════════════════
        const createdUser = await db.user.findUnique({
            where: { id: user.id },
            select: {
                id: true,
                name: true,
                phone: true,
                email: true,
                role: true,
                isActive: true,
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

        return NextResponse.json({
            success: true,
            message: 'Staff member created successfully',
            data: {
                ...createdUser,
                categories: createdUser?.staffCategories.map(sc => sc.category),
                staffCategories: undefined,
            }
        })

    } catch (error) {
        console.error('❌ Admin staff create error:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}