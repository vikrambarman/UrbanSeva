// app/api/public/provider-inquiry/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { name, phone, email, experience, services, city, message } = body

        // Validate required fields
        if (!name || !phone) {
            return NextResponse.json(
                { success: false, error: 'Name and phone are required' },
                { status: 400 }
            )
        }

        // Check if phone already exists in inquiries
        const existingInquiry = await db.providerInquiry.findFirst({
            where: { phone }
        })

        if (existingInquiry) {
            return NextResponse.json(
                { success: false, error: 'You have already submitted an application' },
                { status: 400 }
            )
        }

        // Check if already a provider
        const existingUser = await db.user.findUnique({
            where: { phone }
        })

        if (existingUser && existingUser.role === 'PROVIDER') {
            return NextResponse.json(
                { success: false, error: 'This phone number is already registered as a provider' },
                { status: 400 }
            )
        }

        // Create inquiry
        await db.providerInquiry.create({
            data: {
                name,
                phone,
                email: email || null,
                experience: experience ? parseInt(experience) : null,
                services: services || null,
                city: city || null,
                message: message || null,
                status: 'PENDING'
            }
        })

        // TODO: Send notification to admin
        // TODO: Send confirmation SMS to applicant

        return NextResponse.json({
            success: true,
            message: 'Application submitted successfully'
        })
    } catch (error) {
        console.error('Provider Inquiry Error:', error)
        return NextResponse.json(
            { success: false, error: 'Submission failed. Please try again.' },
            { status: 500 }
        )
    }
}