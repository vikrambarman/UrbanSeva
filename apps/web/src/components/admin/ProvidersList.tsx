// components/admin/ProvidersList.tsx

"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ProviderTable } from "@/components/admin/ProviderTable"

interface ProvidersListProps {
    initialData: {
        providers: any[]
        pagination: {
            page: number
            limit: number
            total: number
            totalPages: number
        }
    }
}

export function ProvidersList({ initialData }: ProvidersListProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    
    const [search, setSearch] = useState(searchParams.get('search') || "")
    const [status, setStatus] = useState(searchParams.get('status') || "ALL")

    const updateURL = (newSearch: string, newStatus: string, newPage: number = 1) => {
        const params = new URLSearchParams()
        if (newSearch) params.set('search', newSearch)
        if (newStatus && newStatus !== 'ALL') params.set('status', newStatus)
        if (newPage > 1) params.set('page', newPage.toString())
        
        router.push(`/admin/providers?${params.toString()}`)
    }

    const handleSearchChange = (value: string) => {
        setSearch(value)
        setTimeout(() => {
            updateURL(value, status, 1)
        }, 500)
    }

    const handleStatusChange = (value: string) => {
        setStatus(value)
        updateURL(search, value, 1)
    }

    const handleReset = () => {
        setSearch("")
        setStatus("ALL")
        router.push('/admin/providers')
    }

    const handlePageChange = (page: number) => {
        updateURL(search, status, page)
    }

    return (
        <ProviderTable
            providers={initialData.providers}
            pagination={initialData.pagination}
            search={search}
            status={status}
            onSearchChange={handleSearchChange}
            onStatusChange={handleStatusChange}
            onReset={handleReset}
            onPageChange={handlePageChange}
        />
    )
}