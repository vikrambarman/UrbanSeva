import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 })
    }

    // Get user wallet balance
    const user = await db.user.findUnique({
      where: { id: payload.userId },
      select: { walletBalance: true, loyaltyPoints: true, loyaltyTier: true },
    })

    // Get recent transactions
    const transactions = await db.walletTransaction.findMany({
      where: { userId: payload.userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })

    return NextResponse.json({
      success: true,
      data: {
        balance: user?.walletBalance || 0,
        loyaltyPoints: user?.loyaltyPoints || 0,
        loyaltyTier: user?.loyaltyTier || 'BRONZE',
        transactions,
      },
    })
  } catch (error) {
    console.error('Get Wallet Error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch wallet' }, { status: 500 })
  }
}