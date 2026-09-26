import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminUser } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
    try {
        const admin = await getAdminUser(request)
        if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

        const { inquiryId, password, commissionRate } = await request.json()
        const inquiry = await db.providerInquiry.findUnique({ where: { id: inquiryId } })
        if (!inquiry) return NextResponse.json({ success: false, error: 'Inquiry not found' }, { status: 404 })

        const hashedPassword = await bcrypt.hash(password, 10)

        const result = await db.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    name: inquiry.name,
                    phone: inquiry.phone,
                    email: inquiry.email,
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
                    experience: inquiry.experience || 0,
                    bio: inquiry.message,
                    commissionRate: commissionRate || 15,
                    isAvailable: true
                }
            })

            if (process.env.NODE_ENV === 'development') {
                console.log('\n📧 ========== PROVIDER CREDENTIALS ==========')
                console.log(`Name: ${inquiry.name}`)
                console.log(`Phone: ${inquiry.phone}`)
                console.log(`Password: ${password}`)
                console.log('==========================================\n')
            }

            await tx.providerInquiry.update({
                where: { id: inquiryId },
                data: { status: 'APPROVED', notes: `Created by admin ${admin.phone} on ${new Date().toISOString()}` }
            })
            return { user, provider }
        })

        return NextResponse.json({ success: true, data: result })
    } catch (e) {
        console.error(e)
        return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 })
    }
}