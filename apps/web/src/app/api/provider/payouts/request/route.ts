// Provider Payout Request
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getProviderUser } from '@/lib/auth'

export async function POST(request: NextRequest) {
    try {
        const provider = await getProviderUser(request)
        if (!provider) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const body = await request.json()
        const { amount, method, bankDetails, upiId, notes } = body

        // Validate
        if (!amount || amount <= 0) {
            return NextResponse.json(
                { success: false, error: 'Invalid amount' },
                { status: 400 }
            )
        }

        if (!method || !['BANK_TRANSFER', 'UPI', 'CASH'].includes(method)) {
            return NextResponse.json(
                { success: false, error: 'Invalid payout method' },
                { status: 400 }
            )
        }

        // Get provider data
        const providerData = await db.provider.findUnique({
            where: { userId: provider.userId },
            select: {
                id: true,
                walletBalance: true
            }
        })

        if (!providerData) {
            return NextResponse.json(
                { success: false, error: 'Provider not found' },
                { status: 404 }
            )
        }

        // Check if sufficient balance
        if (providerData.walletBalance < amount) {
            return NextResponse.json(
                { success: false, error: 'Insufficient wallet balance' },
                { status: 400 }
            )
        }

        // Check for any pending payout request
        const pendingPayout = await db.payout.findFirst({
            where: {
                providerId: providerData.id,
                status: 'PENDING'
            }
        })

        if (pendingPayout) {
            return NextResponse.json(
                { success: false, error: 'You already have a pending payout request' },
                { status: 400 }
            )
        }

        // Create payout request
        const payout = await db.payout.create({
            data: {
                providerId: providerData.id,
                amount,
                method,
                bankDetails: bankDetails || null,
                upiId: upiId || null,
                notes: notes || null,
                status: 'PENDING'
            }
        })

        // Deduct from wallet balance (hold the amount)
        await db.provider.update({
            where: { id: providerData.id },
            data: {
                walletBalance: {
                    decrement: amount
                }
            }
        })

        // Create wallet transaction
        await db.providerWalletTransaction.create({
            data: {
                providerId: providerData.id,
                type: 'PAYOUT_HOLD',
                amount,
                description: `Payout request #${payout.id} - Amount held`,
                referenceId: payout.id,
                balanceAfter: providerData.walletBalance - amount
            }
        })

        return NextResponse.json({
            success: true,
            message: 'Payout request submitted successfully',
            data: payout
        })

    } catch (error) {
        console.error('Payout Request Error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to submit payout request' },
            { status: 500 }
        )
    }
}

// Get provider's payout history
export async function GET(request: NextRequest) {
    try {
        const provider = await getProviderUser(request)
        if (!provider) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const providerData = await db.provider.findUnique({
            where: { userId: provider.userId },
            select: { id: true }
        })

        if (!providerData) {
            return NextResponse.json(
                { success: false, error: 'Provider not found' },
                { status: 404 }
            )
        }

        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '10')
        const skip = (page - 1) * limit

        const payouts = await db.payout.findMany({
            where: { providerId: providerData.id },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit
        })

        const totalPayouts = await db.payout.count({
            where: { providerId: providerData.id }
        })

        return NextResponse.json({
            success: true,
            data: {
                payouts,
                pagination: {
                    page,
                    limit,
                    total: totalPayouts,
                    totalPages: Math.ceil(totalPayouts / limit)
                }
            }
        })

    } catch (error) {
        console.error('Payout History Error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch payout history' },
            { status: 500 }
        )
    }
}