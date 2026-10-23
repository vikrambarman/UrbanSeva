import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getProviderUser } from '@/lib/auth'

// GET: Payout History
export async function GET(request: NextRequest) {
    try {
        const provider = await getProviderUser(request)
        if (!provider) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        const providerData = await db.provider.findUnique({
            where: { userId: provider.userId },
            select: { id: true }
        })

        if (!providerData) {
            return NextResponse.json({ success: false, error: 'Provider not found' }, { status: 404 })
        }

        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '20')
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
        return NextResponse.json({ success: false, error: 'Failed to fetch payout history' }, { status: 500 })
    }
}

// POST: Request Payout
export async function POST(request: NextRequest) {
    try {
        const provider = await getProviderUser(request)
        if (!provider) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { amount, method } = body

        // ✅ Validation
        if (!amount || amount <= 0) {
            return NextResponse.json({ success: false, error: 'Invalid amount' }, { status: 400 })
        }

        if (!method || !['BANK_TRANSFER', 'UPI', 'CASH'].includes(method)) {
            return NextResponse.json({ success: false, error: 'Invalid payout method' }, { status: 400 })
        }

        // ✅ Fetch provider with bank details
        const providerData = await db.provider.findUnique({
            where: { userId: provider.userId },
            select: { 
                id: true, 
                walletBalance: true,
                bankAccount: true,
                bankIFSC: true,
                bankName: true,
                upiId: true
            }
        })

        if (!providerData) {
            return NextResponse.json({ success: false, error: 'Provider not found' }, { status: 404 })
        }

        if (providerData.walletBalance < amount) {
            return NextResponse.json({ success: false, error: 'Insufficient wallet balance' }, { status: 400 })
        }

        // ✅ Method-wise validation using saved details
        if (method === 'BANK_TRANSFER') {
            if (!providerData.bankAccount || !providerData.bankIFSC || !providerData.bankName) {
                return NextResponse.json({ 
                    success: false, 
                    error: 'Please update your bank details in profile first' 
                }, { status: 400 })
            }
        }

        if (method === 'UPI' && !providerData.upiId) {
            return NextResponse.json({ 
                success: false, 
                error: 'Please update your UPI ID in profile first' 
            }, { status: 400 })
        }

        // Check for any pending payout request
        const pendingPayout = await db.payout.findFirst({
            where: { providerId: providerData.id, status: 'PENDING' }
        })

        if (pendingPayout) {
            return NextResponse.json({ success: false, error: 'You already have a pending payout request' }, { status: 400 })
        }

        // Create payout request & deduct from wallet in a transaction
        const payout = await db.$transaction(async (tx) => {
            // ✅ Use correct field names from schema
            const newPayout = await tx.payout.create({
                data: {
                    providerId: providerData.id,
                    amount,
                    method,
                    bankAccount: method === 'BANK_TRANSFER' ? providerData.bankAccount : null,
                    bankIFSC: method === 'BANK_TRANSFER' ? providerData.bankIFSC : null,
                    bankName: method === 'BANK_TRANSFER' ? providerData.bankName : null,
                    upiId: method === 'UPI' ? providerData.upiId : null,
                    status: 'PENDING'
                }
            })

            // Deduct from wallet
            await tx.provider.update({
                where: { id: providerData.id },
                data: { walletBalance: { decrement: amount } }
            })

            const updatedProvider = await tx.provider.findUnique({
                where: { id: providerData.id },
                select: { walletBalance: true }
            })

            // Create wallet transaction
            await tx.providerWalletTransaction.create({
                data: {
                    providerId: providerData.id,
                    type: 'PAYOUT_HOLD',
                    amount,
                    description: `Payout request #${newPayout.id} - Amount held`,
                    referenceId: newPayout.id,
                    balanceAfter: updatedProvider?.walletBalance || 0
                }
            })

            // Mark related pending earnings as PAYOUT_INITIATED
            await tx.providerEarning.updateMany({
                where: { 
                    providerId: providerData.id, 
                    status: 'PENDING' 
                },
                data: { status: 'PAYOUT_INITIATED' }
            })

            return newPayout
        })

        return NextResponse.json({
            success: true,
            message: 'Payout request submitted successfully',
            data: payout
        })

    } catch (error) {
        console.error('Payout Request Error:', error)
        return NextResponse.json({ success: false, error: 'Failed to submit payout request' }, { status: 500 })
    }
}