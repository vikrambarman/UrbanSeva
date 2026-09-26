// app/admin/providers/page.tsx

import { Suspense } from "react"
import { ProvidersList } from "@/components/admin/ProvidersList"
import { db } from "@/lib/db"

export const dynamic = 'force-dynamic'
export const revalidate = 0

async function getProviders(searchParams: {
    page?: string
    search?: string
    status?: string
}) {
    // ✅ FIX: Direct access, no await needed here (already extracted)
    const page = parseInt(searchParams.page || '1')
    const limit = 10
    const search = searchParams.search || ''
    const status = searchParams.status

    const where: any = {}
    
    if (search) {
        where.OR = [
            { user: { name: { contains: search, mode: 'insensitive' } } },
            { user: { phone: { contains: search } } },
        ]
    }
    if (status && status !== 'ALL') where.status = status

    const [providers, total] = await Promise.all([
        db.provider.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                user: { 
                    select: { 
                        name: true, 
                        phone: true, 
                        email: true, 
                        avatar: true 
                    } 
                },
                _count: { 
                    select: { 
                        services: true, 
                        bookings: true 
                    } 
                }
            }
        }),
        db.provider.count({ where })
    ])

    return {
        providers,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    }
}

// ✅ FIX: Async component with awaited searchParams
export default async function AdminProvidersPage({
    searchParams
}: {
    searchParams: Promise<{ page?: string; search?: string; status?: string }>
}) {
    // ✅ Await searchParams before using
    const params = await searchParams
    const data = await getProviders(params)

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Provider Management</h1>
                <p className="text-muted-foreground">
                    Manage service providers, approvals, and commissions.
                    {data.pagination.total > 0 && (
                        <span className="ml-2 font-medium">Total: {data.pagination.total} providers</span>
                    )}
                </p>
            </div>

            <Suspense fallback={
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            }>
                <ProvidersList initialData={data} />
            </Suspense>
        </div>
    )
}