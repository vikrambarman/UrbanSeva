// components/admin/ServicesList.tsx

"use client"

import { useState } from "react"
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
}

export function ServicesList({ initialData }: ServicesListProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    
    const [services, setServices] = useState(initialData.services)
    const [pagination, setPagination] = useState(initialData.pagination)
    const [search, setSearch] = useState(searchParams.get('search') || "")
    const [status, setStatus] = useState(searchParams.get('status') || "ALL")

    const updateURL = (newSearch: string, newStatus: string, newPage: number = 1) => {
        const params = new URLSearchParams()
        if (newSearch) params.set('search', newSearch)
        if (newStatus && newStatus !== 'ALL') params.set('status', newStatus)
        if (newPage > 1) params.set('page', newPage.toString())
        
        router.push(`/admin/services?${params.toString()}`)
    }

    const handleSearchChange = (value: string) => {
        setSearch(value)
        const timer = setTimeout(() => {
            updateURL(value, status, 1)
        }, 500)
        return () => clearTimeout(timer)
    }

    const handleStatusChange = (value: string) => {
        setStatus(value)
        updateURL(search, value, 1)
    }

    const handleReset = () => {
        setSearch("")
        setStatus("ALL")
        router.push('/admin/services')
    }

    const handlePageChange = (page: number) => {
        updateURL(search, status, page)
    }

    // ✅ Optimistic update for toggle
    const handleToggle = async (id: string, current: boolean) => {
        const newStatus = !current
        
        // Optimistic update
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
                // Revert on error
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
                
                // Update with server data
                setServices(prev => prev.map(service => 
                    service.id === id 
                        ? data.data 
                        : service
                ))
            } else {
                // Revert on error
                setServices(prev => prev.map(service => 
                    service.id === id 
                        ? { ...service, isActive: current } 
                        : service
                ))
                toast.error(data.error)
            }
        } catch (error) {
            console.error('Toggle error:', error)
            // Revert on error
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
                router.refresh() // ✅ Refresh server component
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
            pagination={pagination}
            onSearchChange={handleSearchChange}
            onStatusChange={handleStatusChange}
            onReset={handleReset}
            onToggleActive={handleToggle}
            onDelete={handleDelete}
            onPageChange={handlePageChange}
        />
    )
}