// apps/web/src/app/api/admin/providers/create/route.ts
// CHANGE: serviceIds array receive karke ProviderService entries create ki
// CHANGE: Transaction mein sab kuch ek saath hoga — atomic operation
// WHY: Provider create karte waqt hi services assign ho jayengi

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

            // 3. NEW: Create ProviderService entries
            if (serviceIds && serviceIds.length > 0) {
                await tx.providerService.createMany({
                    data: serviceIds.map((serviceId: string) => ({
                        providerId: provider.id,
                        serviceId: serviceId,
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
            console.log(`Services Assigned: ${serviceIds.length}`)
            console.log('==========================================\n')
        }

        return NextResponse.json({
            success: true,
            message: 'Provider created successfully with services',
            data: result
        })

    } catch (error) {
        console.error('Create Provider Error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to create provider' },
            { status: 500 }
        )
    }
}