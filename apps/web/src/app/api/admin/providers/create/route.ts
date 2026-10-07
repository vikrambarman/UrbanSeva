// ═══════════════════════════════
// CHANGE: Add service ID validation before creating ProviderService
// WHY: Foreign key constraint error aa raha tha - serviceIds validate nahi ho rahe the
// ═══════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminUser } from '@/lib/auth'
import bcrypt from 'bcryptjs'

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
        const { 
            name, phone, email, password, experience, 
            bio, commissionRate, aadharNumber, panNumber,
            serviceIds // NEW: Array of service IDs
        } = body

        // Validate
        if (!name || !phone || !password) {
            return NextResponse.json(
                { success: false, error: 'Name, phone, and password required' },
                { status: 400 }
            )
        }

        if (phone.length !== 10) {
            return NextResponse.json(
                { success: false, error: 'Phone must be 10 digits' },
                { status: 400 }
            )
        }

        // Validate serviceIds
        if (!serviceIds || !Array.isArray(serviceIds) || serviceIds.length === 0) {
            return NextResponse.json(
                { success: false, error: 'At least one service must be selected' },
                { status: 400 }
            )
        }

        // Check existing
        const existingUser = await db.user.findUnique({
            where: { phone }
        })

        if (existingUser) {
            return NextResponse.json(
                { success: false, error: 'Phone already registered' },
                { status: 400 }
            )
        }

        const plainPassword = password
        const hashedPassword = await bcrypt.hash(password, 10)

        // CHANGE: Transaction mein sab kuch ek saath — atomic operation
        const result = await db.$transaction(async (tx) => {
            // 1. Create User
            const user = await tx.user.create({
                data: {
                    name,
                    phone,
                    email: email || null,
                    password: hashedPassword,
                    role: 'PROVIDER',
                    isVerified: true,
                    isActive: true
                }
            })

            // 2. Create Provider
            const provider = await tx.provider.create({
                data: {
                    userId: user.id,
                    status: 'APPROVED',
                    experience: experience || 0,
                    bio: bio || null,
                    commissionRate: commissionRate || 15,
                    isAvailable: true,
                    aadharNumber: aadharNumber || null,
                    panNumber: panNumber || null
                }
            })

            // 3. NEW: Validate serviceIds exist in Service table
            // ═══════════════════════════════
            // KYA: Service IDs verify karna before ProviderService creation
            // KYUN: Foreign key constraint error se bachne ke liye
            // ═══════════════════════════════
            if (serviceIds && serviceIds.length > 0) {
                // Fetch all services from database
                const validServices = await tx.service.findMany({
                    where: {
                        id: {
                            in: serviceIds
                        },
                        isActive: true  // Only active services
                    },
                    select: {
                        id: true,
                        name: true
                    }
                })

                // Check if all serviceIds are valid
                if (validServices.length === 0) {
                    throw new Error('No valid services found. Please select active services.')
                }

                if (validServices.length < serviceIds.length) {
                    // Some services are invalid
                    const validIds = validServices.map(s => s.id)
                    const invalidIds = serviceIds.filter(id => !validIds.includes(id))
                    
                    console.warn(`Invalid service IDs detected: ${invalidIds.join(', ')}`)
                    
                    // Option 1: Throw error (strict validation)
                    throw new Error(
                        `${invalidIds.length} service(s) not found or inactive. Valid services: ${validServices.length}`
                    )
                    
                    // Option 2: Only create for valid services (lenient - uncomment if needed)
                    // serviceIds = validIds
                }

                // Create ProviderService entries only for valid services
                await tx.providerService.createMany({
                    data: validServices.map((service) => ({
                        providerId: provider.id,
                        serviceId: service.id,
                        assignedBy: admin.userId,
                        isActive: true,
                    }))
                })
            }

            return { user, provider }
        })

        // SMS credentials (console in dev)
        if (process.env.NODE_ENV === 'development') {
            console.log('\n📧 ========== PROVIDER CREDENTIALS ==========')
            console.log(`Name: ${name}`)
            console.log(`Phone: ${phone}`)
            console.log(`Password: ${plainPassword}`)
            console.log(`Login: ${process.env.NEXT_PUBLIC_APP_URL}/provider-login`)
            console.log(`Services Assigned: ${result.provider.id}`)
            console.log('==========================================\n')
        }

        return NextResponse.json({
            success: true,
            message: 'Provider created successfully with services',
            data: result
        })

    } catch (error) {
        console.error('Create Provider Error:', error)
        
        // Handle Prisma constraint errors
        if (error instanceof Error) {
            if (error.message.includes('Foreign key constraint')) {
                return NextResponse.json(
                    { success: false, error: 'Invalid service IDs. Please ensure all selected services are active.' },
                    { status: 400 }
                )
            }
        }
        
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : 'Failed to create provider' },
            { status: 500 }
        )
    }
}