/**
 * WHAT: Production-ready booking creation API
 * WHY: 
 * - Use existing addressId from cart (not create new address every time)
 * - Initial status: PAYMENT_RECEIVED (OPS verification pending)
 * - Support both ONLINE and POD payment methods
 * - GST calculation based on category settings (inclusive pricing)
 * - NEW: Commission calculation based on category settings
 * - NEW: Save complete financial breakdown in Booking model
 * - HYBRID: Service-level overrides take precedence over Category defaults
 * NOTE: Backward compatible - old code will still work
 */

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { sendBookingReceived } from '@/lib/notifications'

export async function POST(request: Request) {
    try {
        // Verify authentication
        const authHeader = request.headers.get('authorization')
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const token = authHeader.substring(7)
        const payload = verifyToken(token)
        if (!payload) {
            return NextResponse.json(
                { success: false, error: 'Invalid token' },
                { status: 401 }
            )
        }

        const body = await request.json()
        const {
            serviceId,
            scheduledDate,
            scheduledTime,
            addressId,
            address,
            specialInstructions,
            paymentMethod,
            baseAmount,
            addOnAmount,
            totalAmount,
            pricingLabel,
            addOns,
            couponCode,
            discountAmount,
        } = body

        // Validate required fields
        if (!serviceId || !scheduledDate || !scheduledTime) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            )
        }

        // Determine address ID
        let finalAddressId = addressId

        // LEGACY: If addressId not provided, create new address (backward compatibility)
        if (!finalAddressId && address) {
            const createdAddress = await db.address.create({
                data: {
                    userId: payload.userId,
                    label: address.label,
                    fullAddress: address.fullAddress,
                    area: address.area,
                    landmark: address.landmark,
                    pincode: address.pincode,
                },
            })
            finalAddressId = createdAddress.id
        }

        if (!finalAddressId) {
            return NextResponse.json(
                { success: false, error: 'Address is required' },
                { status: 400 }
            )
        }

        // ═══════════════════════════════
        // FETCH SERVICE & CATEGORY (For GST & Commission)
        // ═══════════════════════════════
        const service = await db.service.findUnique({
            where: { id: serviceId },
            include: {
                subCategory: {
                    include: {
                        category: true,
                    },
                },
            },
        })

        if (!service) {
            return NextResponse.json(
                { success: false, error: 'Service not found' },
                { status: 404 }
            )
        }

        const category = service.subCategory.category

        // ═══════════════════════════════
        // FINANCIAL CALCULATIONS (Model 1: GST Inclusive)
        // HYBRID APPROACH: Service Override > Category Default
        // ═══════════════════════════════
        
        // 1. Total Amount (What customer pays)
        const finalTotalAmount = totalAmount || (baseAmount + (addOnAmount || 0))
        
        // 2. GST Breakdown (Service level overrides category level)
        const isGstEnabled = service.gstEnabled ?? category.gstEnabled
        const gstPercentage = service.gstPercentage ?? category.gstPercentage
        const gstRate = isGstEnabled ? (gstPercentage || 0) : 0 // e.g., 18
        
        const calculatedBaseAmount = gstRate > 0 
            ? finalTotalAmount / (1 + gstRate / 100) 
            : finalTotalAmount
        const calculatedGstAmount = finalTotalAmount - calculatedBaseAmount
        const cgstAmount = gstRate > 0 ? calculatedBaseAmount * (gstRate / 2 / 100) : 0 // 9%
        const sgstAmount = gstRate > 0 ? calculatedBaseAmount * (gstRate / 2 / 100) : 0 // 9%

        // 3. Commission Breakdown (Service level overrides category level)
        const commissionType = service.commissionType ?? category.commissionType // 'PERCENTAGE' or 'FIXED'
        const commissionValue = service.commissionValue ?? category.commissionValue // e.g., 20 or 50
        
        let companyCommission = 0
        if (commissionType === 'FIXED') {
            companyCommission = commissionValue || 0
        } else {
            companyCommission = calculatedBaseAmount * ((commissionValue || 0) / 100)
        }
        
        const providerEarningAmt = calculatedBaseAmount - companyCommission

        // Generate booking number
        const bookingNumber = `BK${Date.now()}${Math.floor(Math.random() * 1000)}`

        const isPOD = paymentMethod === 'POD' || paymentMethod === 'COD'
        const initialStatus = 'PENDING'
        const initialPaymentStatus = 'PENDING' 

        // Create booking with ALL financial fields
        const booking = await db.booking.create({
            data: {
                bookingNumber,
                userId: payload.userId,
                serviceId,
                addressId: finalAddressId,
                scheduledDate: new Date(scheduledDate),
                scheduledTime,
                pricingLabel,
                addOns: addOns || null,
                baseAmount: calculatedBaseAmount,
                addOnAmount: addOnAmount || 0,
                discountAmount: discountAmount || 0,
                couponCode: couponCode || null,
                totalAmount: finalTotalAmount,
                specialInstructions,
                paymentMethod: paymentMethod || 'ONLINE',
                status: initialStatus,
                paymentStatus: initialPaymentStatus,
                
                // ═══════════════════════════════
                // NEW: Save Financial Breakdown
                // ═══════════════════════════════
                gstRate: gstRate,
                cgstAmount: cgstAmount,
                sgstAmount: sgstAmount,
                companyCommission: companyCommission,
                commissionRate: commissionValue || 0,
                providerEarningAmt: providerEarningAmt,
            },
            include: {
                service: true,
                user: {
                    select: {
                        id: true,
                        name: true,
                        phone: true,
                    },
                },
            },
        })

        // ✅ NEW: Update Coupon usage count if applied
        if (couponCode) {
            await db.coupon.update({
                where: { code: couponCode },
                data: { usedCount: { increment: 1 } }
            }).catch(err => console.error('Coupon update error:', err))
        }

        // Create payment record
        await db.payment.create({
            data: {
                bookingId: booking.id,
                amount: finalTotalAmount,
                currency: 'INR',
                method: paymentMethod || 'ONLINE',
                status: initialPaymentStatus,
            },
        })

        // Create status history
        await db.bookingStatusHistory.create({
            data: {
                bookingId: booking.id,
                status: initialStatus,
                note: isPOD
                    ? 'Booking created via POD (Payment on Delivery). Waiting for OPS confirmation and provider assignment.'
                    : 'Payment received, waiting for OPS confirmation',
                changedBy: payload.userId,
            },
        })

        // Send notification to customer
        try {
            await sendBookingReceived(
                payload.userId,
                booking.user.phone,
                booking.bookingNumber,
                booking.totalAmount
            )
        } catch (notifError) {
            console.error('Notification error:', notifError)
        }

        return NextResponse.json({
            success: true,
            message: 'Booking created successfully',
            data: booking,
        })
    } catch (error) {
        console.error('Create Booking Error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to create booking' },
            { status: 500 }
        )
    }
}