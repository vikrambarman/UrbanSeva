import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

// ═══════════════════════════════════════════════════════════════
// CUSTOMER WALLET API
// ═══════════════════════════════════════════════════════════════
// KYA: Customer wallet balance aur transactions fetch karna
// KYUN: Refunds, loyalty points, aur transaction history dikhane ke liye
// FLOW: JWT verify → User data fetch → Wallet transactions fetch
// ═══════════════════════════════════════════════════════════════

export async function GET(request: Request) {
  try {
    // 1. Authentication - JWT Token verify karo
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 })
    }

    // 2. Get user wallet balance & loyalty info
    const user = await db.user.findUnique({
      where: { id: payload.userId },
      select: { 
        walletBalance: true, 
        loyaltyPoints: true, 
        loyaltyTier: true 
      },
    })

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    // 3. Get recent wallet transactions (last 20)
    // CHANGE: Pagination support add kiya future-proofing ke liye
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const page = parseInt(searchParams.get('page') || '1')
    const skip = (page - 1) * limit

    const transactions = await db.walletTransaction.findMany({
      where: { userId: payload.userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    })

    const totalTransactions = await db.walletTransaction.count({
      where: { userId: payload.userId }
    })

    // 4. Return response
    return NextResponse.json({
      success: true,
      data: {
        balance: user.walletBalance || 0,
        loyaltyPoints: user.loyaltyPoints || 0,
        loyaltyTier: user.loyaltyTier || 'BRONZE',
        transactions,
        pagination: {
          page,
          limit,
          total: totalTransactions,
          totalPages: Math.ceil(totalTransactions / limit)
        }
      },
    })
  } catch (error) {
    console.error('Get Wallet Error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch wallet' }, { status: 500 })
  }
}