/**
 * WHAT: Bookings list API with filters
 * WHY: OPS aur Customer dono ke liye bookings fetch karne ke liye
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
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

        const { searchParams } = new URL(request.url)
        const role = searchParams.get('role') || 'CUSTOMER'
        const status = searchParams.get('status')
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '10')

        const skip = (page - 1) * limit

        // Build where clause
        const where: Record<string, any> = {}

        if (role === 'CUSTOMER') {
            where.userId = payload.userId
        }

        if (status && status !== 'ALL') {
            where.status = status
        }

        // Fetch bookings
        const bookings = await db.booking.findMany({
            where,
            include: {
                service: {
                    select: {
                        name: true,
                        image: true,
                        subCategory: {
                            select: {
                                name: true,
                                category: {
                                    select: { name: true }
                                }
                            }
                        }
                    }
                },
                address: {
                    select: {
                        label: true,
                        fullAddress: true,
                        area: true,
                    }
                },
                provider: {
                    select: {
                        id: true,
                        avgRating: true,
                        user: {
                            select: {
                                name: true,
                                phone: true,
                            }
                        }
                    }
                },
                user: role === 'OPS' ? {
                    select: {
                        name: true,
                        phone: true,
                    }
                } : false,
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
        })

        // Get total count
        const total = await db.booking.count({ where })

        return NextResponse.json({
            success: true,
            data: {
                bookings,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                }
            }
        })
    } catch (error) {
        console.error('Bookings List Error:', error)
        return NextResponse.json({ success: false, error: 'Failed to fetch bookings' }, { status: 500 })
    }
}