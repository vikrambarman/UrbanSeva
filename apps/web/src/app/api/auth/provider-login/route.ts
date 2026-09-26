import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { generateToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
    try {
        const { phone, password } = await request.json()
        if (!phone || !password) return NextResponse.json({ success: false, error: 'Phone and password required' }, { status: 400 })

        const user = await db.user.findUnique({
            where: { phone },
            include: {
                provider: true
            }
        })

        if (!user || !user.password) return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 })
        if (user.role !== 'PROVIDER' || !user.provider) return NextResponse.json({ success: false, error: 'Not a provider account' }, { status: 403 })
        if (user.provider.status !== 'APPROVED') return NextResponse.json({ success: false, error: `Account ${user.provider.status}` }, { status: 403 })

        const isValid = await bcrypt.compare(password, user.password)
        if (!isValid) return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 })

        const token = generateToken({ userId: user.id, phone: user.phone, role: user.role as any, providerId: user.provider.id })

        await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date(), loginCount: { increment: 1 } } })

        const { password: _, ...safeUser } = user as any
        return NextResponse.json({ success: true, token, user: safeUser })
    } catch (e) {
        console.error(e)
        return NextResponse.json({ success: false, error: 'Login failed' }, { status: 500 })
    }
}