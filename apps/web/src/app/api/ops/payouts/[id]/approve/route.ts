// OPS - Approve or Reject Payout
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminUser } from '@/lib/auth'

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const admin = await getAdminUser(request)
        if (!admin) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const { id } = params
        const body = await request.json()
        const { action, rejectionReason, transactionId } = body // action: 'APPROVE' or 'REJECT'

        if (!action || !['APPROVE', 'REJECT'].includes(action)) {
            return NextResponse.json(
                { success: false, error: 'Invalid action' },
                { status: 400 }
            )
        }

        // Get payout
        const payout = await db.payout.findUnique({
            where: { id },
            include: {
                provider: true
            }
        })

        if (!payout) {
            return NextResponse.json(
                { success: false, error: 'Payout not found' },
                { status: 404 }
            )
        }

        if (payout.status !== 'PENDING') {
            return NextResponse.json(
                { success: false, error: 'Payout already processed' },
                { status: 400 }
            )
        }

        if (action === 'APPROVE') {
            // Update payout status
            await db.payout.update({
                where: { id },
                data: {
                    status: 'COMPLETED',
                    processedBy: admin.userId,
                    processedAt: new Date(),
                    transactionId: transactionId || null
                }
            })

            // Create wallet transaction for payout completion
            await db.providerWalletTransaction.create({
                data: {
                    providerId: payout.providerId,
                    type: 'PAYOUT_COMPLETED',
                    amount: payout.amount,
                    description: `Payout #${payout.id} completed via ${payout.method}`,
                    referenceId: payout.id,
                    balanceAfter: payout.provider.walletBalance
                }
            })

            return NextResponse.json({
                success: true,
                message: 'Payout approved successfully'
            })

        } else {
            // REJECT - Return amount to wallet
            await db.payout.update({
                where: { id },
                data: {
                    status: 'REJECTED',
                    processedBy: admin.userId,
                    processedAt: new Date(),
                    rejectionReason: rejectionReason || null
                }
            })

            // Return amount to wallet
            await db.provider.update({
                where: { id: payout.providerId },
                data: {
                    walletBalance: {
                        increment: payout.amount
                    }
                }
            })

            // Create wallet transaction for refund
            const updatedProvider = await db.provider.findUnique({
                where: { id: payout.providerId },
                select: { walletBalance: true }
            })

            await db.providerWalletTransaction.create({
                data: {
                    providerId: payout.providerId,
                    type: 'PAYOUT_REFUND',
                    amount: payout.amount,
                    description: `Payout #${payout.id} rejected - Amount refunded`,
                    referenceId: payout.id,
                    balanceAfter: updatedProvider?.walletBalance || 0
                }
            })

            return NextResponse.json({
                success: true,
                message: 'Payout rejected, amount refunded to wallet'
            })
        }

    } catch (error) {
        console.error('Payout Approval Error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to process payout' },
            { status: 500 }
        )
    }
}