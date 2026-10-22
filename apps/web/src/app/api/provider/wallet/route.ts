// Provider Wallet - Get balance & transaction history
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getProviderUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
    try {
        const provider = await getProviderUser(request)
        if (!provider) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            )
        }

        // Get provider with wallet balance
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

        // Get wallet transactions
        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '20')
        const skip = (page - 1) * limit

        const transactions = await db.providerWalletTransaction.findMany({
            where: { providerId: providerData.id },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
            include: {
                booking: {
                    select: {
                        id: true,
                        bookingNumber: true,
                        customerName: true,
                        totalAmount: true
                    }
                }
            }
        })

        const totalTransactions = await db.providerWalletTransaction.count({
            where: { providerId: providerData.id }
        })

        return NextResponse.json({
            success: true,
            data: {
                walletBalance: providerData.walletBalance,
                transactions,
                pagination: {
                    page,
                    limit,
                    total: totalTransactions,
                    totalPages: Math.ceil(totalTransactions / limit)
                }
            }
        })

    } catch (error) {
        console.error('Provider Wallet Error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch wallet data' },
            { status: 500 }
        )
    }
}