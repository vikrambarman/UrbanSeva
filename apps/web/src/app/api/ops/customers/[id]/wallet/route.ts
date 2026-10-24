import { NextRequest, NextResponse } from 'next/server';
import { getCallingTeamUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        // 1. Auth check
        const user = await getCallingTeamUser(req);
        if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

        // 2. Await params
        const { id } = await params;
        const body = await req.json();
        const { type, amount, reason } = body; // type: 'credit' | 'debit'

        // 3. Validation
        if (!type || !amount || !reason) {
            return NextResponse.json({ success: false, error: 'Missing type, amount, or reason' }, { status: 400 });
        }

        const amt = parseFloat(amount);
        if (isNaN(amt) || amt <= 0) {
            return NextResponse.json({ success: false, error: 'Invalid amount' }, { status: 400 });
        }

        const customer = await prisma.user.findUnique({ where: { id } });
        if (!customer) {
            return NextResponse.json({ success: false, error: 'Customer not found' }, { status: 404 });
        }

        // 4. Calculate new balance
        let newBalance = customer.walletBalance;
        if (type === 'credit') {
            newBalance += amt;
        } else if (type === 'debit') {
            if (customer.walletBalance < amt) {
                return NextResponse.json({ success: false, error: 'Insufficient wallet balance' }, { status: 400 });
            }
            newBalance -= amt;
        } else {
            return NextResponse.json({ success: false, error: 'Invalid type' }, { status: 400 });
        }

        // 5. Transaction: Update balance & create wallet history
        const [updatedUser, transaction] = await prisma.$transaction([
            prisma.user.update({
                where: { id },
                data: { walletBalance: newBalance }
            }),
            prisma.walletTransaction.create({ 
                data: {
                    userId: id,
                    amount: amt, // Amount hamesha positive rakhein
                    type: type === 'credit' ? 'CREDIT' : 'DEBIT', // ✅ FIXED: Valid Enum (CREDIT/DEBIT)
                    balance: newBalance, // ✅ FIXED: 'balance' field required hai schema mein
                    description: reason,
                    // status field hata diya hai kyunki schema mein exist nahi karta
                }
            })
        ]);

        return NextResponse.json({ success: true, data: { user: updatedUser, transaction } });
    } catch (error: any) {
        console.error('POST /api/ops/customers/[id]/wallet error:', error);
        return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}