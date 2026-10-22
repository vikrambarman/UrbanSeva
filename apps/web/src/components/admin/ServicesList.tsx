"use client"

import { useState, useEffect, useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ServiceTable } from "@/components/admin/ServiceTable"
import { toast } from "sonner"
import { apiFetch } from "@/lib/api-client"

interface ServicesListProps {
    initialData: {
        services: any[]
        pagination: {
            page: number
            limit: number
            total: number
            totalPages: number
        }
    }
    // ═══════════════════════════════════════════════════════════════
    // NEW: Categories for filter dropdown
    // ═══════════════════════════════════════════════════════════════
    categories: { id: string; name: string; _count: { subCategories: number } }[]
}

export function ServicesList({ initialData, categories }: ServicesListProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    
    const [isPending, startTransition] = useTransition()
    
    const [services, setServices] = useState(initialData.services)
    const [pagination, setPagination] = useState(initialData.pagination)
    const [search, setSearch] = useState(searchParams.get('search') || "")
    const [status, setStatus] = useState(searchParams.get('status') || "ALL")
    // ═══════════════════════════════════════════════════════════════
    // NEW: Category filter state
    // ═══════════════════════════════════════════════════════════════
    const [categoryId, setCategoryId] = useState(searchParams.get('categoryId') || "ALL")

    useEffect(() => {
        setServices(initialData.services)
        setPagination(initialData.pagination)
    }, [initialData])

    // ═══════════════════════════════════════════════════════════════
    // CHANGE: Added categoryId to URL params
    // ═══════════════════════════════════════════════════════════════
    const updateURL = (newSearch: string, newStatus: string, newCategoryId: string, newPage: number = 1) => {
        const params = new URLSearchParams()
        if (newSearch) params.set('search', newSearch)
        if (newStatus && newStatus !== 'ALL') params.set('status', newStatus)
        if (newCategoryId && newCategoryId !== 'ALL') params.set('categoryId', newCategoryId)
        if (newPage > 1) params.set('page', newPage.toString())
        
        const newUrl = `/admin/services?${params.toString()}`
        
        startTransition(() => {
            router.push(newUrl)
        })
    }

    const handleSearchChange = (value: string) => {
        setSearch(value)
        setTimeout(() => {
            updateURL(value, status, categoryId, 1)
        }, 500)
    }

    const handleStatusChange = (value: string) => {
        setStatus(value)
        updateURL(search, value, categoryId, 1)
    }

    // ═══════════════════════════════════════════════════════════════
    // NEW: Category change handler
    // ═══════════════════════════════════════════════════════════════
    const handleCategoryChange = (value: string) => {
        setCategoryId(value)
        updateURL(search, status, value, 1)
    }

    const handleReset = () => {
        setSearch("")
        setStatus("ALL")
        setCategoryId("ALL")
        startTransition(() => {
            router.push('/admin/services')
        })
    }

    const handlePageChange = (page: number) => {
        updateURL(search, status, categoryId, page)
    }

    const handleToggle = async (id: string, current: boolean) => {
        const newStatus = !current
        
        setServices(prev => prev.map(service => 
            service.id === id 
                ? { ...service, isActive: newStatus } 
                : service
        ))

        try {
            const res = await apiFetch(`/api/admin/services/${id}`, {
                method: 'PUT',
                body: JSON.stringify({ isActive: newStatus })
            })
            
            if (!res || !res.ok) {
                setServices(prev => prev.map(service => 
                    service.id === id 
                        ? { ...service, isActive: current } 
                        : service
                ))
                toast.error("Failed to update")
                return
            }
            
            const data = await res.json()
            
            if (data.success) { 
                toast.success(`Service ${newStatus ? 'activated' : 'deactivated'}`)
                setServices(prev => prev.map(service => 
                    service.id === id 
                        ? data.data 
                        : service
                ))
            } else {
                setServices(prev => prev.map(service => 
                    service.id === id 
                        ? { ...service, isActive: current } 
                        : service
                ))
                toast.error(data.error)
            }
        } catch (error) {
            console.error('Toggle error:', error)
            setServices(prev => prev.map(service => 
                service.id === id 
                    ? { ...service, isActive: current } 
                    : service
            ))
            toast.error("Failed to update")
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Deactivate this service?")) return
        
        try {
            const res = await apiFetch(`/api/admin/services/${id}`, { 
                method: 'DELETE' 
            })
            
            if (!res || !res.ok) {
                toast.error("Failed to delete")
                return
            }
            
            const data = await res.json()
            if (data.success) { 
                toast.success("Service deactivated")
                router.refresh()
            } else {
                toast.error(data.error)
            }
        } catch (error) {
            console.error('Delete error:', error)
            toast.error("Failed to delete")
        }
    }

    return (
        <ServiceTable
            services={services}
            search={search}
            status={status}
            categoryId={categoryId}
            categories={categories}
            pagination={pagination}
            onSearchChange={handleSearchChange}
            onStatusChange={handleStatusChange}
            onCategoryChange={handleCategoryChange}
            onReset={handleReset}
            onToggleActive={handleToggle}
            onDelete={handleDelete}
            onPageChange={handlePageChange}
            isLoading={isPending}
        />
    )
}