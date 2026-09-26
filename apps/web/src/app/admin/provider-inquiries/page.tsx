// app/admin/provider-inquiries/page.tsx

import { Suspense } from "react"
import { ProviderInquiriesList } from "@/components/admin/ProviderInquiriesList"
import { Button } from "@/components/ui/button"
import { UserPlus } from "lucide-react"
import Link from "next/link"
import { db } from "@/lib/db"

export const dynamic = 'force-dynamic'
export const revalidate = 0

async function getInquiries(searchParams: {
    page?: string
    status?: string
}) {
    const page = parseInt(searchParams.page || '1')
    const limit = 10
    const status = searchParams.status

    const where: any = {}
    if (status && status !== 'ALL') where.status = status

    const [inquiries, total] = await Promise.all([
        db.providerInquiry.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { createdAt: 'desc' }
        }),
        db.providerInquiry.count({ where })
    ])

    return {
        inquiries,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    }
}

export default async function AdminProviderInquiriesPage({
    searchParams
}: {
    searchParams: Promise<{ page?: string; status?: string }>
}) {
    const params = await searchParams
    const data = await getInquiries(params)

    return (
        <div className="p-6 space-y-6">
            {/* ✅ Header with Add Provider Button */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Provider Applications</h1>
                    <p className="text-muted-foreground">
                        Review and manage provider registration requests.
                        {data.pagination.total > 0 && (
                            <span className="ml-2 font-medium">Total: {data.pagination.total} applications</span>
                        )}
                    </p>
                </div>
                
                {/* ✅ Add Provider Button */}
                <Button asChild>
                    <Link href="/admin/providers/create">
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add Provider Manually
                    </Link>
                </Button>
            </div>

            <Suspense fallback={
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            }>
                <ProviderInquiriesList initialData={data} />
            </Suspense>
        </div>
    )
}