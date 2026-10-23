import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
    try {
        const admin = await getAdminUser(request)
        if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status')

        const where: any = {}
        if (status && status !== 'ALL') where.status = status

        // ✅ FIX: Provider details include karo (bank details, UPI ID, etc.)
        const payouts = await db.payout.findMany({
            where,
            orderBy: { createdAt: 'desc' },
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

        return NextResponse.json({ success: true, data: payouts })
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed to fetch payouts' }, { status: 500 })
    }
}

// Process Payout (Mark as completed)
export async function POST(request: NextRequest) {
    try {
        const admin = await getAdminUser(request)
        if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

        const body = await request.json()
        const { payoutId, notes } = body

        if (!payoutId) return NextResponse.json({ success: false, error: 'Payout ID required' }, { status: 400 })

        // ✅ FIX: Payout fetch karo with provider details
        const payout = await db.payout.findUnique({
            where: { id: payoutId },
            include: {
                provider: {
                    include: {
                        user: { select: { name: true } }
                    }
                }
            }
        })

        if (!payout) {
            return NextResponse.json({ success: false, error: 'Payout not found' }, { status: 404 })
        }

        if (payout.status !== 'PENDING') {
            return NextResponse.json({ success: false, error: 'Payout already processed' }, { status: 400 })
        }

        const updatedPayout = await db.payout.update({
            where: { id: payoutId },
            data: { 
                status: 'COMPLETED', 
                processedAt: new Date(),
                notes: notes || payout.notes,
                reference: `PAID-${Date.now()}`
            }
        })

        // Update related ProviderEarnings to PAID
        await db.providerEarning.updateMany({
            where: { providerId: payout.providerId, status: 'PAYOUT_INITIATED' },
            data: { status: 'PAID' }
        })

        // ✅ FIX: Create wallet transaction for payout completion
        await db.providerWalletTransaction.create({
            data: {
                providerId: payout.providerId,
                type: 'PAYOUT_COMPLETED',
                amount: payout.amount,
                description: `Payout #${payoutId} completed via ${payout.method}`,
                referenceId: payoutId,
                balanceAfter: 0 // Will be updated by next query
            }
        })

        return NextResponse.json({ success: true, data: updatedPayout })
    } catch (error) {
        console.error('Process Payout Error:', error)
        return NextResponse.json({ success: false, error: 'Failed to process payout' }, { status: 500 })
    }
}