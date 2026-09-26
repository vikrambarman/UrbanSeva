import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
    try {
        const admin = await getAdminUser(request)
        if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '10')
        const search = searchParams.get('search') || ''
        const isActive = searchParams.get('isActive')

        const where: any = {}
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { slug: { contains: search, mode: 'insensitive' } },
            ]
        }
        if (isActive !== null && isActive !== '' && isActive !== 'ALL') {
            where.isActive = isActive === 'true'
        }

        const [services, total] = await Promise.all([
            db.service.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    subCategory: { select: { name: true, category: { select: { name: true } } } },
                    _count: { select: { bookings: true, reviews: true } }
                }
            }),
            db.service.count({ where })
        ])

        return NextResponse.json({
            success: true,
            data: { services, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } }
        })
    } catch (error) {
        console.error('Admin Services GET Error:', error)
        return NextResponse.json({ success: false, error: 'Failed to fetch services' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const admin = await getAdminUser(request)
        if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

        const body = await request.json()

        const newService = await db.service.create({
            data: {
                name: body.name,
                slug: body.slug || body.name.toLowerCase().replace(/\s+/g, '-'),
                description: body.description,
                image: body.image,
                basePrice: body.basePrice,
                priceType: body.priceType || 'FIXED',
                duration: body.duration,
                professionals: body.professionals || 1,
                guarantee: body.guarantee,
                subCategoryId: body.subCategoryId,
                isTrending: body.isTrending || false,
                isFeatured: body.isFeatured || false,
                inclusions: body.inclusions ? { create: body.inclusions.map((text: string, i: number) => ({ text, sortOrder: i })) } : undefined,
                exclusions: body.exclusions ? { create: body.exclusions.map((text: string, i: number) => ({ text, sortOrder: i })) } : undefined,
                pricingTiers: body.pricingTiers ? { create: body.pricingTiers.map((tier: any, i: number) => ({ label: tier.label, price: tier.price, duration: tier.duration, sortOrder: i })) } : undefined,
                addOns: body.addOns ? { create: body.addOns.map((addon: any) => ({ name: addon.name, price: addon.price, description: addon.description })) } : undefined,
                faqs: body.faqs ? { create: body.faqs.map((faq: any, i: number) => ({ question: faq.question, answer: faq.answer, sortOrder: i })) } : undefined,
            }
        })

        return NextResponse.json({ success: true, data: newService })
    } catch (error) {
        console.error('Admin Services POST Error:', error)
        return NextResponse.json({ success: false, error: 'Failed to create service' }, { status: 500 })
    }
}