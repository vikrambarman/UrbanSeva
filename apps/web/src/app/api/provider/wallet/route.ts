// src/app/api/provider/wallet/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
    try {
        // Verify authentication
        const authHeader = request.headers.get('authorization')
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const token = authHeader.substring(7)
        const payload = verifyToken(token)
        if (!payload) {
            return NextResponse.json(
                { success: false, error: 'Invalid token' },
                { status: 401 }
            )
        }

        // Get provider data
        const providerData = await db.provider.findUnique({
            where: { userId: payload.userId },
            select: { id: true, walletBalance: true }
        })

        if (!providerData) {
            return NextResponse.json(
                { success: false, error: 'Provider not found' },
                { status: 404 }
            )
        }

        // Pagination
        const searchParams = request.nextUrl.searchParams
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '20')
        const skip = (page - 1) * limit

        // ═══════════════════════════════════════════════════════════════
        // FIX: Removed `customerName` from booking select
        // Added `user` relation to get customer name
        // ═══════════════════════════════════════════════════════════════
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
                        totalAmount: true,
                        // ═══════════════════════════════════════════════════════════════
                        // FIX: Include user relation for customer name
                        // ═══════════════════════════════════════════════════════════════
                        user: {
                            select: {
                                id: true,
                                name: true,
                                phone: true,
                            }
                        }
                    }
                }
            }
        })

        const total = await db.providerWalletTransaction.count({
            where: { providerId: providerData.id }
        })

        return NextResponse.json({
            success: true,
            data: {
                balance: providerData.walletBalance,
                transactions,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            }
        })

    } catch (error) {
        console.error('Provider Wallet GET Error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch wallet data' },
            { status: 500 }
        )
    }
}