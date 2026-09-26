// src/app/admin/users/page.tsx

import { Suspense } from "react"
import { UsersList } from "@/components/admin/UsersList"
import { db } from "@/lib/db"

export const dynamic = 'force-dynamic'
export const revalidate = 0

const VALID_ROLES = ['CUSTOMER', 'PROVIDER', 'ADMIN', 'SUPER_ADMIN']

async function getUsers(searchParams: {
    page?: string
    search?: string
    role?: string
    status?: string
}) {
    const page = Math.max(1, parseInt(searchParams.page || '1') || 1)
    const limit = 10
    const search = searchParams.search?.trim() || ''
    const roleParam = searchParams.role?.trim().toUpperCase()
    const isActiveParam = searchParams.status?.trim()

    const where: any = {}
    
    if (search) {
        where.OR = [
            { name: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search } },
            { email: { contains: search, mode: 'insensitive' } },
        ]
    }

    // Exact Enum Role match for CUSTOMER, PROVIDER, ADMIN, SUPER_ADMIN
    if (roleParam && roleParam !== 'ALL') {
        if (VALID_ROLES.includes(roleParam)) {
            where.role = roleParam
        }
    }

    if (isActiveParam !== undefined && isActiveParam !== null && isActiveParam !== '' && isActiveParam !== 'ALL') {
        where.isActive = isActiveParam === 'true'
    }

    const [users, total] = await Promise.all([
        db.user.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                name: true,
                phone: true,
                email: true,
                avatar: true,
                role: true,
                isActive: true,
                isVerified: true,
                createdAt: true,
                walletBalance: true,
                loyaltyTier: true,
                _count: {
                    select: { bookings: true, reviews: true }
                }
            }
        }),
        db.user.count({ where })
    ])

    return {
        users,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit) || 1
        }
    }
}

export default async function AdminUsersPage({
    searchParams
}: {
    searchParams: Promise<{ page?: string; search?: string; role?: string; status?: string }>
}) {
    const params = await searchParams
    const data = await getUsers(params)

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
                <p className="text-muted-foreground">
                    Manage all registered users, customers, and providers.
                    {data.pagination.total > 0 && (
                        <span className="ml-2 font-medium">Total: {data.pagination.total} users</span>
                    )}
                </p>
            </div>

            <Suspense fallback={
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            }>
                <UsersList key={JSON.stringify(params)} initialData={data} />
            </Suspense>
        </div>
    )
}