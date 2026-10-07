/**
 * WHAT: Provider requests payout
 * WHY: 
 * - Provider settled earnings ko withdraw karega
 * - Payout request OPS ko jayegi approval ke liye
 * - Provider payout method select karega (Bank/UPI)
 * NOTE: Only SETTLED earnings can be withdrawn
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getProviderUser } from '@/lib/auth'

export async function POST(request: NextRequest) {
    try {
        const providerAuth = await getProviderUser(request)
        if (!providerAuth) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

        const provider = await db.provider.findUnique({ 
            where: { userId: providerAuth.userId },
            include: { user: { select: { name: true, phone: true } } }
        })
        if (!provider) return NextResponse.json({ success: false, error: 'Provider not found' }, { status: 404 })

        const body = await request.json()
        const { amount, payoutMethod, payoutDetails } = body

        if (!amount || amount <= 0) {
            return NextResponse.json({ success: false, error: 'Invalid amount' }, { status: 400 })
        }

        // Check available balance (SETTLED earnings)
        const settledEarnings = await db.providerEarning.aggregate({
            where: { 
                providerId: provider.id, 
                status: 'SETTLED' 
            },
            _sum: { net: true }
        })

        const availableBalance = settledEarnings._sum.net || 0

        if (amount > availableBalance) {
            return NextResponse.json({ 
                success: false, 
                error: `Insufficient balance. Available: ₹${availableBalance}` 
            }, { status: 400 })
        }

        // Validate payout method
        if (!['BANK_TRANSFER', 'UPI', 'CASH'].includes(payoutMethod)) {
            return NextResponse.json({ success: false, error: 'Invalid payout method' }, { status: 400 })
        }

        // Create payout request
        const payout = await db.payout.create({
            data: {
                providerId: provider.id,
                amount,
                method: payoutMethod,
                status: 'PENDING',
                reference: payoutDetails?.reference || null,
            }
        })

        // Mark earnings as PAYOUT_INITIATED
        await db.providerEarning.updateMany({
            where: { 
                providerId: provider.id, 
                status: 'SETTLED' 
            },
            data: { status: 'PAYOUT_INITIATED' }
        })

        return NextResponse.json({
            success: true,
            message: 'Payout request submitted successfully',
            data: payout
        })

    } catch (error) {
        console.error('Payout request error:', error)
        return NextResponse.json({ success: false, error: 'Failed to create payout request' }, { status: 500 })
    }
}