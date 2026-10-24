import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCallingTeamUser } from '@/lib/auth' // ✅ FIXED

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // ✅ FIXED: Calling team ko access diya
        const user = await getCallingTeamUser(request)
        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params
        const body = await request.json()
        const { action, rejectionReason, transactionId } = body

        if (!action || !['APPROVE', 'REJECT'].includes(action)) {
            return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
        }

        const payout = await db.payout.findUnique({
            where: { id },
            include: { provider: true }
        })

        if (!payout) return NextResponse.json({ success: false, error: 'Payout not found' }, { status: 404 })
        if (payout.status !== 'PENDING') return NextResponse.json({ success: false, error: 'Payout already processed' }, { status: 400 })

        if (action === 'APPROVE') {
            await db.payout.update({
                where: { id },
                data: { status: 'COMPLETED', processedBy: user.userId, processedAt: new Date(), reference: transactionId || null }
            })

            await db.providerWalletTransaction.create({
                data: {
                    providerId: payout.providerId,
                    type: 'PAYOUT_COMPLETED',
                    amount: -payout.amount, // Debit from wallet
                    description: `Payout #${payout.id} completed via ${payout.method}`,
                    referenceId: payout.id,
                    balanceAfter: payout.provider.walletBalance - payout.amount // Note: Balance was already decremented on request
                }
            })

            return NextResponse.json({ success: true, message: 'Payout approved successfully' })
        } else {
            // REJECT - Return amount to wallet
            await db.payout.update({
                where: { id },
                data: { status: 'REJECTED', processedBy: user.userId, processedAt: new Date(), rejectionReason: rejectionReason || null }
            })

            const updatedProvider = await db.provider.update({
                where: { id: payout.providerId },
                data: { walletBalance: { increment: payout.amount } }
            })

            await db.providerWalletTransaction.create({
                data: {
                    providerId: payout.providerId,
                    type: 'PAYOUT_REFUND',
                    amount: payout.amount,
                    description: `Payout #${payout.id} rejected - Amount refunded`,
                    referenceId: payout.id,
                    balanceAfter: updatedProvider.walletBalance
                }
            })

            return NextResponse.json({ success: true, message: 'Payout rejected, amount refunded to wallet' })
        }
    } catch (error) {
        console.error('Payout Approval Error:', error)
        return NextResponse.json({ success: false, error: 'Failed to process payout' }, { status: 500 })
    }
}