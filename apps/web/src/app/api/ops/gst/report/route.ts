/**
 * ═══════════════════════════════════════════════════════════════
 * GST REPORT API
 * ═══════════════════════════════════════════════════════════════
 * KYA: GST collection report generate karna (CGST + SGST breakdown)
 * KYUN: Ambikapur, Chhattisgarh me intra-state GST lagta hai
 * FLOW: Date filter → Bookings se GST data → Category-wise breakdown → Summary
 * ═══════════════════════════════════════════════════════════════
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
    try {
        const admin = await getAdminUser(request)
        if (!admin) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const { searchParams } = new URL(request.url)
        const period = searchParams.get('period') || 'month'
        const categoryFilter = searchParams.get('categoryId') || null

        // Date range calculate karo
        const now = new Date()
        let startDate: Date

        switch (period) {
            case 'today':
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
                break
            case 'week':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
                break
            case 'month':
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
                break
            case 'quarter':
                startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
                break
            case 'year':
                startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
                break
            default:
                startDate = new Date(0) // All time
        }

        // Base where clause
        const whereClause: any = {
            createdAt: { gte: startDate },
            // Sirf paid/completed bookings count karo
            OR: [
                { paymentStatus: 'PAID' },
                { 
                    status: { in: ['SERVICE_COMPLETED', 'NO_SHOW'] },
                    paymentMethod: 'POD'
                }
            ]
        }

        if (categoryFilter) {
            whereClause.service = {
                subCategory: {
                    categoryId: categoryFilter
                }
            }
        }

        // 1. Bookings fetch karo with GST data
        const bookings = await db.booking.findMany({
            where: whereClause,
            select: {
                id: true,
                bookingNumber: true,
                totalAmount: true,
                baseAmount: true,
                gstRate: true,
                cgstAmount: true,
                sgstAmount: true,
                companyCommission: true,
                providerEarningAmt: true,
                paymentMethod: true,
                paymentStatus: true,
                status: true,
                createdAt: true,
                service: {
                    select: {
                        name: true,
                        subCategory: {
                            select: {
                                name: true,
                                category: {
                                    select: {
                                        id: true,
                                        name: true
                                    }
                                }
                            }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        })

        // 2. Summary calculate karo
        let totalBaseAmount = 0
        let totalGST = 0
        let totalCGST = 0
        let totalSGST = 0
        let totalCommission = 0
        let totalProviderEarning = 0
        let totalRevenue = 0

        // Category-wise breakdown
        const categoryBreakdown: Record<string, {
            categoryId: string
            categoryName: string
            totalBase: number
            totalGST: number
            totalCGST: number
            totalSGST: number
            commission: number
            bookingCount: number
        }> = {}

        bookings.forEach((booking) => {
            const base = booking.baseAmount || 0
            const cgst = booking.cgstAmount || 0
            const sgst = booking.sgstAmount || 0
            const gst = cgst + sgst
            const commission = booking.companyCommission || 0
            const providerEarning = booking.providerEarningAmt || 0

            totalBaseAmount += base
            totalGST += gst
            totalCGST += cgst
            totalSGST += sgst
            totalCommission += commission
            totalProviderEarning += providerEarning
            totalRevenue += booking.totalAmount || 0

            // Category-wise aggregation
            const category = booking.service?.subCategory?.category
            if (category) {
                if (!categoryBreakdown[category.id]) {
                    categoryBreakdown[category.id] = {
                        categoryId: category.id,
                        categoryName: category.name,
                        totalBase: 0,
                        totalGST: 0,
                        totalCGST: 0,
                        totalSGST: 0,
                        commission: 0,
                        bookingCount: 0
                    }
                }
                categoryBreakdown[category.id].totalBase += base
                categoryBreakdown[category.id].totalGST += gst
                categoryBreakdown[category.id].totalCGST += cgst
                categoryBreakdown[category.id].totalSGST += sgst
                categoryBreakdown[category.id].commission += commission
                categoryBreakdown[category.id].bookingCount += 1
            }
        })

        // 3. Payment method breakdown
        const onlineBookings = bookings.filter(b => b.paymentMethod === 'ONLINE' || b.paymentMethod === 'RAZORPAY_LINK')
        const podBookings = bookings.filter(b => b.paymentMethod === 'POD')

        const onlineGST = onlineBookings.reduce((sum, b) => sum + (b.cgstAmount || 0) + (b.sgstAmount || 0), 0)
        const podGST = podBookings.reduce((sum, b) => sum + (b.cgstAmount || 0) + (b.sgstAmount || 0), 0)

        return NextResponse.json({
            success: true,
            data: {
                period,
                summary: {
                    totalRevenue: Math.round(totalRevenue * 100) / 100,
                    totalBaseAmount: Math.round(totalBaseAmount * 100) / 100,
                    totalGST: Math.round(totalGST * 100) / 100,
                    totalCGST: Math.round(totalCGST * 100) / 100,
                    totalSGST: Math.round(totalSGST * 100) / 100,
                    totalCommission: Math.round(totalCommission * 100) / 100,
                    totalProviderEarning: Math.round(totalProviderEarning * 100) / 100,
                    totalBookings: bookings.length
                },
                paymentBreakdown: {
                    online: {
                        gst: Math.round(onlineGST * 100) / 100,
                        bookings: onlineBookings.length
                    },
                    pod: {
                        gst: Math.round(podGST * 100) / 100,
                        bookings: podBookings.length
                    }
                },
                categoryBreakdown: Object.values(categoryBreakdown).map(cat => ({
                    ...cat,
                    totalBase: Math.round(cat.totalBase * 100) / 100,
                    totalGST: Math.round(cat.totalGST * 100) / 100,
                    totalCGST: Math.round(cat.totalCGST * 100) / 100,
                    totalSGST: Math.round(cat.totalSGST * 100) / 100,
                    commission: Math.round(cat.commission * 100) / 100
                })),
                // Recent bookings for detailed view
                recentBookings: bookings.slice(0, 50).map(b => ({
                    id: b.id,
                    bookingNumber: b.bookingNumber,
                    totalAmount: b.totalAmount,
                    baseAmount: b.baseAmount,
                    cgst: b.cgstAmount,
                    sgst: b.sgstAmount,
                    totalGST: (b.cgstAmount || 0) + (b.sgstAmount || 0),
                    commission: b.companyCommission,
                    providerEarning: b.providerEarningAmt,
                    paymentMethod: b.paymentMethod,
                    serviceName: b.service?.name,
                    categoryName: b.service?.subCategory?.category?.name,
                    createdAt: b.createdAt
                }))
            }
        })

    } catch (error) {
        console.error('GST Report Error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to generate GST report' },
            { status: 500 }
        )
    }
}