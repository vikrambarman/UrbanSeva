/**
 * ═══════════════════════════════════════════════════════════════
 * ADMIN REFUND PROCESSING API
 * ═══════════════════════════════════════════════════════════════
 * KYA: Admin refund approve/reject karta hai
 * KYUN: Customer ko wallet me refund amount credit karna hai
 * FLOW: Booking fetch → Wallet credit → Payment status update → Transaction log
 * ═══════════════════════════════════════════════════════════════
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminUser } from '@/lib/auth'

// GET: Fetch all refund requests
export async function GET(request: NextRequest) {
    try {
        const admin = await getAdminUser(request)
        if (!admin) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        const refunds = await db.booking.findMany({
            where: {
                OR: [
                    { paymentStatus: 'REFUND_INITIATED' },
                    { paymentStatus: 'REFUNDED' }
                ]
            },
            include: {
                user: {
                    select: { name: true, phone: true, email: true }
                },
                service: {
                    select: { name: true }
                }
            },
            orderBy: { updatedAt: 'desc' }
        })

        return NextResponse.json({
            success: true,
            data: refunds
        })

    } catch (error) {
        console.error('Fetch Refunds Error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch refunds' },
            { status: 500 }
        )
    }
}

// POST: Process refund (approve/reject)
export async function POST(request: NextRequest) {
    try {
        const admin = await getAdminUser(request)
        if (!admin) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { bookingId, action, notes } = body // action: 'APPROVE' or 'REJECT'

        // 1. Validate input
        if (!bookingId || !action || !['APPROVE', 'REJECT'].includes(action)) {
            return NextResponse.json(
                { success: false, error: 'Invalid booking ID or action' },
                { status: 400 }
            )
        }

        // 2. Fetch booking
        const booking = await db.booking.findUnique({
            where: { id: bookingId },
            include: {
                user: { select: { id: true, name: true, phone: true } }
            }
        })

        if (!booking) {
            return NextResponse.json(
                { success: false, error: 'Booking not found' },
                { status: 404 }
            )
        }

        // 3. Verify status
        if (booking.paymentStatus !== 'REFUND_INITIATED') {
            return NextResponse.json(
                { success: false, error: 'This booking does not have a pending refund request' },
                { status: 400 }
            )
        }

        // 4. Process based on action
        if (action === 'APPROVE') {
            // APPROVE REFUND - Credit wallet
            const refundAmount = booking.totalAmount

            await db.$transaction(async (tx) => {
                // a. Credit customer wallet
                await tx.user.update({
                    where: { id: booking.userId },
                    data: {
                        walletBalance: {
                            increment: refundAmount
                        }
                    }
                })

                // b. Update booking payment status
                await tx.booking.update({
                    where: { id: bookingId },
                    data: {
                        paymentStatus: 'REFUNDED',
                        specialInstructions: booking.specialInstructions 
                            ? `${booking.specialInstructions}\n\n[REFUND APPROVED by ${admin.userId}]: ${notes || 'No notes'}\nAmount: ₹${refundAmount} credited to wallet`
                            : `[REFUND APPROVED by ${admin.userId}]: ${notes || 'No notes'}\nAmount: ₹${refundAmount} credited to wallet`
                    }
                })

                // c. Create wallet transaction log (agar CustomerWalletTransaction model ho)
                // Note: Abhi humare paas CustomerWalletTransaction model nahi hai, 
                // toh filhaal specialInstructions me log kar rahe hain
                // TODO: Create CustomerWalletTransaction model for proper tracking
            })

            console.log(`✅ Refund approved for booking #${booking.bookingNumber}`)
            console.log(`₹${refundAmount} credited to customer wallet (${booking.user.phone})`)

            return NextResponse.json({
                success: true,
                message: `Refund of ₹${refundAmount} credited to customer wallet successfully`,
                data: {
                    bookingId,
                    refundAmount,
                    status: 'REFUNDED'
                }
            })

        } else {
            // REJECT REFUND - Revert to PAID
            await db.booking.update({
                where: { id: bookingId },
                data: {
                    paymentStatus: 'PAID',
                    specialInstructions: booking.specialInstructions 
                        ? `${booking.specialInstructions}\n\n[REFUND REJECTED by ${admin.userId}]: ${notes || 'No reason provided'}`
                        : `[REFUND REJECTED by ${admin.userId}]: ${notes || 'No reason provided'}`
                }
            })

            console.log(`❌ Refund rejected for booking #${booking.bookingNumber}`)

            return NextResponse.json({
                success: true,
                message: 'Refund request rejected',
                data: {
                    bookingId,
                    status: 'PAID'
                }
            })
        }

    } catch (error) {
        console.error('Process Refund Error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to process refund' },
            { status: 500 }
        )
    }
}