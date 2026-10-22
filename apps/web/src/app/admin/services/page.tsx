// app/admin/services/page.tsx

import { Suspense } from "react"
import { ServicesList } from "@/components/admin/ServicesList"
import { db } from "@/lib/db"

export const dynamic = 'force-dynamic'
export const revalidate = 0

async function getServices(searchParams: {
    page?: string
    search?: string
    status?: string
    categoryId?: string
}) {
    const page = parseInt(searchParams.page || '1')
    const limit = 10
    const search = searchParams.search || ''
    const isActive = searchParams.status
    // ═══════════════════════════════════════════════════════════════
    // NEW: Category filter
    // ═══════════════════════════════════════════════════════════════
    const categoryId = searchParams.categoryId || ''

    const where: any = {}
    
    if (search) {
        where.OR = [
            { name: { contains: search, mode: 'insensitive' } },
            { slug: { contains: search, mode: 'insensitive' } },
        ]
    }
    if (isActive !== undefined && isActive !== '' && isActive !== 'ALL') {
        where.isActive = isActive === 'true'
    }
    // ═══════════════════════════════════════════════════════════════
    // NEW: Filter by category
    // ═══════════════════════════════════════════════════════════════
    if (categoryId && categoryId !== 'ALL') {
        where.subCategory = { categoryId }
    }

    const [services, total] = await Promise.all([
        db.service.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                subCategory: { 
                    select: { 
                        name: true, 
                        category: { 
                            select: { 
                                name: true,
                                // ═══════════════════════════════════════════════════════════════
                                // NEW: Include GST & Commission info for table display
                                // ═══════════════════════════════════════════════════════════════
                                gstEnabled: true,
                                gstPercentage: true,
                            } 
                        } 
                    } 
                },
                _count: { 
                    select: { bookings: true, reviews: true } 
                }
            }
        }),
        db.service.count({ where })
    ])

    return {
        services,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    }
}

// ═══════════════════════════════════════════════════════════════
// NEW: Fetch categories for filter dropdown
// ═══════════════════════════════════════════════════════════════
async function getCategories() {
    return db.category.findMany({
        where: { isActive: true },
        select: {
            id: true,
            name: true,
            _count: { select: { subCategories: true } }
        },
        orderBy: { name: 'asc' }
    })
}

export default async function AdminServicesPage({
    searchParams
}: {
    searchParams: Promise<{ page?: string; search?: string; status?: string; categoryId?: string }>
}) {
    const params = await searchParams
    const [data, categories] = await Promise.all([
        getServices(params),
        getCategories()
    ])

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Service Management</h1>
                <p className="text-muted-foreground">
                    Create, edit, and manage all services offered on the platform.
                    {data.pagination.total > 0 && (
                        <span className="ml-2 font-medium">Total: {data.pagination.total} services</span>
                    )}
                </p>
            </div>

            <Suspense fallback={
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            }>
                <ServicesList initialData={data} categories={categories} />
            </Suspense>
        </div>
    )
}