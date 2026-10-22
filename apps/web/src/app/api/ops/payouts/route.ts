// OPS - Get all pending payouts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminUser } from '@/lib/auth'
import { PayoutStatus } from '@prisma/client' // ADD THIS IMPORT

export async function GET(request: NextRequest) {
    try {
        const admin = await getAdminUser(request)
        if (!admin) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const { searchParams } = new URL(request.url)
        const statusParam = searchParams.get('status') || 'PENDING'
        
        // CHANGE: Enum type cast karo
        const status = statusParam as PayoutStatus
        
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '20')
        const skip = (page - 1) * limit

        const payouts = await db.payout.findMany({
            where: { status }, // Ab ye enum type ka hai
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
            include: {
                provider: {
                    include: {
                        user: {
                            select: {
                                name: true,
                                phone: true,
                                email: true
                            }
                        }
                    }
                }
            }
        })

        const totalPayouts = await db.payout.count({
            where: { status }
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
        console.error('OPS Payouts Error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch payouts' },
            { status: 500 }
        )
    }
}