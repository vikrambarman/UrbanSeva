/**
 * WHAT: OPS approves payout request
 * WHY: 
 * - OPS verifies payout request
 * - Marks as COMPLETED after payment
 * - Updates earning status to PAID
 * NOTE: OPS can add transaction reference (UTR/Transaction ID)
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCallingTeamUser } from '@/lib/auth'
import { sendNotification } from '@/lib/notifications'

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCallingTeamUser(request)
        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const { id: payoutId } = await params
        const body = await request.json()
        const { action, transactionReference, notes } = body // action: 'approve' | 'reject'

        // Find payout
        const payout = await db.payout.findUnique({
            where: { id: payoutId },
            include: {
                provider: {
                    include: {
                        user: { select: { id: true, name: true, phone: true } }
                    }
                }
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

        if (action === 'approve') {
            // Update payout
            await db.payout.update({
                where: { id: payoutId },
                data: {
                    status: 'COMPLETED',
                    processedAt: new Date(),
                    reference: transactionReference || payout.reference,
                }
            })

            // Update earnings to PAID
            await db.providerEarning.updateMany({
                where: { 
                    providerId: payout.providerId,
                    status: 'PAYOUT_INITIATED'
                },
                data: { status: 'PAID' }
            })

            // Notify provider
            try {
                await sendNotification({
                    userId: payout.provider.userId,
                    title: 'Payout Completed',
                    body: `Your payout of ₹${payout.amount} has been processed. Reference: ${transactionReference || 'N/A'}`,
                    type: 'GENERAL',
                    referenceId: payoutId,
                })
            } catch (notifError) {
                console.error('Notification error:', notifError)
            }

            return NextResponse.json({
                success: true,
                message: 'Payout approved successfully'
            })

        } else if (action === 'reject') {
            // Update payout
            await db.payout.update({
                where: { id: payoutId },
                data: {
                    status: 'FAILED',
                }
            })

            // Revert earnings to SETTLED
            await db.providerEarning.updateMany({
                where: { 
                    providerId: payout.providerId,
                    status: 'PAYOUT_INITIATED'
                },
                data: { status: 'SETTLED' }
            })

            // Notify provider
            try {
                await sendNotification({
                    userId: payout.provider.userId,
                    title: 'Payout Request Rejected',
                    body: `Your payout request of ₹${payout.amount} has been rejected. ${notes || ''}`,
                    type: 'GENERAL',
                    referenceId: payoutId,
                })
            } catch (notifError) {
                console.error('Notification error:', notifError)
            }

            return NextResponse.json({
                success: true,
                message: 'Payout rejected'
            })

        } else {
            return NextResponse.json(
                { success: false, error: 'Invalid action' },
                { status: 400 }
            )
        }

    } catch (error) {
        console.error('❌ Payout approval error:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}