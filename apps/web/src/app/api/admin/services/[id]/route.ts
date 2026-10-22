import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminUser } from '@/lib/auth'
import { revalidatePath, revalidateTag } from 'next/cache'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const admin = await getAdminUser(request)
        if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

        const { id } = await params
        const service = await db.service.findUnique({
            where: { id },
            include: {
                subCategory: true,
                inclusions: { orderBy: { sortOrder: 'asc' } },
                exclusions: { orderBy: { sortOrder: 'asc' } },
                pricingTiers: { orderBy: { sortOrder: 'asc' } },
                addOns: true,
                faqs: { orderBy: { sortOrder: 'asc' } },
            }
        })

        if (!service) return NextResponse.json({ success: false, error: 'Service not found' }, { status: 404 })
        return NextResponse.json({ success: true, data: service })
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed to fetch service' }, { status: 500 })
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const admin = await getAdminUser(request)
        if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

        const { id } = await params
        const body = await request.json()

        const isSimpleToggle = Object.keys(body).length === 1 && 'isActive' in body

        let updatedService

        if (isSimpleToggle) {
            updatedService = await db.service.update({
                where: { id },
                data: { isActive: body.isActive },
                include: {
                    subCategory: { 
                        select: { 
                            name: true, 
                            category: { select: { name: true } } 
                        } 
                    },
                    _count: { 
                        select: { bookings: true, reviews: true } 
                    }
                }
            })
        } else {
            updatedService = await db.$transaction(async (tx) => {
                await tx.serviceInclusion.deleteMany({ where: { serviceId: id } })
                await tx.serviceExclusion.deleteMany({ where: { serviceId: id } })
                await tx.servicePricing.deleteMany({ where: { serviceId: id } })
                await tx.serviceAddOn.deleteMany({ where: { serviceId: id } })
                await tx.serviceFAQ.deleteMany({ where: { serviceId: id } })

                return tx.service.update({
                    where: { id },
                    data: {
                        name: body.name,
                        slug: body.slug,
                        description: body.description,
                        image: body.image,
                        basePrice: body.basePrice,
                        priceType: body.priceType,
                        duration: body.duration,
                        professionals: body.professionals,
                        guarantee: body.guarantee,
                        subCategoryId: body.subCategoryId,
                        isTrending: body.isTrending,
                        isFeatured: body.isFeatured,
                        isActive: body.isActive,
                        
                        // ═══════════════════════════════
                        // NEW: Service-level overrides for GST & Commission
                        // ═══════════════════════════════
                        gstEnabled: body.gstEnabled === undefined ? null : body.gstEnabled,
                        gstPercentage: (body.gstPercentage !== undefined && body.gstPercentage !== null && body.gstPercentage !== '') ? parseFloat(body.gstPercentage) : null,
                        commissionType: body.commissionType === undefined ? null : body.commissionType,
                        commissionValue: (body.commissionValue !== undefined && body.commissionValue !== null && body.commissionValue !== '') ? parseFloat(body.commissionValue) : null,

                        inclusions: { create: (body.inclusions || []).map((text: string, i: number) => ({ text, sortOrder: i })) },
                        exclusions: { create: (body.exclusions || []).map((text: string, i: number) => ({ text, sortOrder: i })) },
                        pricingTiers: { create: (body.pricingTiers || []).map((tier: any, i: number) => ({ label: tier.label, price: tier.price, duration: tier.duration, sortOrder: i })) },
                        addOns: { create: (body.addOns || []).map((addon: any) => ({ name: addon.name, price: addon.price, description: addon.description })) },
                        faqs: { create: (body.faqs || []).map((faq: any, i: number) => ({ question: faq.question, answer: faq.answer, sortOrder: i })) },
                    },
                    include: {
                        subCategory: { 
                            select: { 
                                name: true, 
                                category: { select: { name: true } } 
                            } 
                        },
                        _count: { 
                            select: { bookings: true, reviews: true } 
                        }
                    }
                })
            })
        }

        revalidatePath('/admin/services')
        return NextResponse.json({ success: true, data: updatedService })
    } catch (error) {
        console.error('Admin Services PUT Error:', error)
        return NextResponse.json({ success: false, error: 'Failed to update service' }, { status: 500 })
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const admin = await getAdminUser(request)
        if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

        const { id } = await params
        // Soft delete
        await db.service.update({ where: { id }, data: { isActive: false } })

        return NextResponse.json({ success: true, message: 'Service deactivated successfully' })
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed to delete service' }, { status: 500 })
    }
}