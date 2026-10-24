import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    // 1. Auth Check
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const user = verifyToken(token);
    if (!user || !['ADMIN', 'SUPER_ADMIN', 'CALLING_TEAM'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 2. Parse Query Params
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status'); // active / inactive
    const tier = searchParams.get('tier'); // loyalty tier

    const skip = (page - 1) * limit;

    // 3. Build Where Clause
    const where: any = {
      role: 'CUSTOMER', // ✅ STRICT FILTER: Sirf Customers
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status === 'active') where.isActive = true;
    if (status === 'inactive') where.isActive = false;
    if (tier) where.loyaltyTier = tier.toUpperCase();

    // 4. Fetch Data using `include` (Fixes TS _count errors)
    const [customers, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          bookings: {
            select: { totalAmount: true } // Sirf amount fetch karein (memory save)
          },
          addresses: {
            select: { id: true } // Sirf id fetch karein count karne ke liye
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    // 5. Format Response using JS Array Methods
    const formattedCustomers = customers.map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      avatar: c.avatar,
      role: c.role,
      isActive: c.isActive,
      isVerified: c.isVerified,
      walletBalance: c.walletBalance,
      loyaltyPoints: c.loyaltyPoints,
      loyaltyTier: c.loyaltyTier,
      lastLoginAt: c.lastLoginAt,
      createdAt: c.createdAt,
      // ✅ JS se calculate karein (No Prisma _count/_sum issues)
      totalBookings: c.bookings.length,
      totalSpent: c.bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0),
      totalAddresses: c.addresses.length,
    }));

    return NextResponse.json({
      success: true,
      data: formattedCustomers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Error fetching customers:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}