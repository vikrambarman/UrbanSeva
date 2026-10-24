import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminUser } from '@/lib/auth'

export async function POST(request: NextRequest) {
    try {
        const admin = await getAdminUser(request)
        if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

        const body = await request.json()
        const { providerId, amount, method, bankDetails, upiId, notes } = body

        if (!providerId || !amount || amount <= 0 || !method) {
            return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
        }

        // 1. Fetch Provider
        const provider = await db.provider.findUnique({
            where: { id: providerId },
            include: { user: { select: { name: true, phone: true } } }
        })

        if (!provider) {
            return NextResponse.json({ success: false, error: 'Provider not found' }, { status: 404 })
        }

        if (provider.walletBalance < amount) {
            return NextResponse.json({ success: false, error: 'Insufficient wallet balance' }, { status: 400 })
        }

        if (method === 'BANK_TRANSFER' && !bankDetails) {
            return NextResponse.json({ success: false, error: 'Bank details required' }, { status: 400 })
        }
        if (method === 'UPI' && !upiId) {
            return NextResponse.json({ success: false, error: 'UPI ID required' }, { status: 400 })
        }

        // 2. Create Payout (Admin initiated)
        const payout = await db.payout.create({
            data: {
                providerId,
                amount,
                method,
                bankDetails,
                upiId,
                notes: notes || 'Manual payout initiated by Admin',
                status: 'PENDING',
                transactionId: `MANUAL-${Date.now()}`
            } as any
        })

        // 3. Deduct Wallet Balance
        await db.provider.update({
            where: { id: providerId },
            data: { walletBalance: { decrement: amount } }
        })

        // 4. Update related earnings
        await db.providerEarning.updateMany({
            where: { providerId, status: 'PENDING' },
            data: { status: 'PAYOUT_INITIATED' }
        })

        return NextResponse.json({ success: true, data: payout })
    } catch (error) {
        console.error('Manual Payout Error:', error)
        return NextResponse.json({ success: false, error: 'Failed to process manual payout' }, { status: 500 })
    }
}