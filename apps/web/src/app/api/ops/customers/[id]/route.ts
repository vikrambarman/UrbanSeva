import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const user = verifyToken(authHeader.split(' ')[1]);
    if (!user || !['ADMIN', 'SUPER_ADMIN', 'CALLING_TEAM'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    // Fetch complete customer data
    const customer = await prisma.user.findUnique({
      where: { id, role: 'CUSTOMER' },
      include: {
        addresses: {
          orderBy: { createdAt: 'desc' }
        },
        bookings: {
          orderBy: { createdAt: 'desc' },
          include: {
            service: { 
              select: { name: true, image: true, slug: true } 
            },
            provider: {
              select: { 
                user: { select: { name: true, phone: true } },
                avgRating: true
              }
            },
            address: {
              select: { fullAddress: true, area: true }
            },
            review: {
              select: { overallRating: true, comment: true }
            },
            payment: {
              select: { amount: true, method: true, status: true, paidAt: true }
            }
          }
        },
        walletTxns: {
          orderBy: { createdAt: 'desc' },
        },
        reviews: {
          orderBy: { createdAt: 'desc' },
          include: {
            service: { select: { name: true } },
            booking: { select: { bookingNumber: true } }
          }
        }
      }
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Calculate totals
    const totalBookings = customer.bookings.length;
    const totalSpent = customer.bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
    const completedBookings = customer.bookings.filter(b => b.status === 'SERVICE_COMPLETED').length;
    const cancelledBookings = customer.bookings.filter(b => b.status.includes('CANCELLED')).length;
    const pendingBookings = customer.bookings.filter(b => ['PENDING', 'CONFIRMED', 'PROVIDER_ASSIGNED'].includes(b.status)).length;

    // Wallet calculations
    const totalWalletCredit = customer.walletTxns
      .filter(t => t.type === 'CREDIT' || t.type === 'REFUND' || t.type === 'CASHBACK')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalWalletDebit = customer.walletTxns
      .filter(t => t.type === 'DEBIT')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    return NextResponse.json({
      success: true,
      data: {
        ...customer,
        // Calculated fields
        totalBookings,
        totalSpent,
        completedBookings,
        cancelledBookings,
        pendingBookings,
        totalWalletCredit,
        totalWalletDebit,
        totalAddresses: customer.addresses.length,
        totalReviews: customer.reviews.length,
      }
    });
  } catch (error: any) {
    console.error('Error fetching customer detail:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}