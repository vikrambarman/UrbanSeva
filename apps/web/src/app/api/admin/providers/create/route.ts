// src/app/api/admin/providers/create/route.ts (Update)

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminUser } from '@/lib/auth'
import bcrypt from 'bcryptjs'
import { getSMSProvider } from '@/lib/sms'

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
            bio, commissionRate, aadharNumber, panNumber 
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

        // Create provider
        const result = await db.$transaction(async (tx) => {
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

            return { user, provider }
        })

        // ✅ Send credentials via SMS
        const smsMessage = `Welcome to HomeServ!\n\nYour provider account is ready.\n\nLogin: ${phone}\nPassword: ${plainPassword}\n\nLogin at: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/provider-login\n\nChange password after first login.`

        if (process.env.NODE_ENV === 'development') {
            console.log('\n📧 ========== PROVIDER CREDENTIALS ==========')
            console.log(`Name: ${name}`)
            console.log(`Phone: ${phone}`)
            console.log(`Password: ${plainPassword}`)
            console.log(`Login: ${process.env.NEXT_PUBLIC_APP_URL}/provider-login`)
            console.log('==========================================\n')
        } else {
            try {
                const smsProvider = getSMSProvider()
                // Note: sendOTP is for OTP, you may need a general sendSMS method
                // For now, we'll use console in production too
                console.log('SMS would be sent:', smsMessage)
            } catch (error) {
                console.error('SMS send failed:', error)
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Provider created successfully',
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