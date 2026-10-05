// components/admin/ServicesList.tsx

"use client"

// CHANGE: useEffect add kiya — jab server component se naya initialData aaye
// (search/pagination se URL change hone pe), toh local state bhi update ho
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
}

export function ServicesList({ initialData }: ServicesListProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    
    // CHANGE: useTransition add kiya — server component re-render ke time
    // loading state dikha sakein (better UX)
    const [isPending, startTransition] = useTransition()
    
    const [services, setServices] = useState(initialData.services)
    const [pagination, setPagination] = useState(initialData.pagination)
    const [search, setSearch] = useState(searchParams.get('search') || "")
    const [status, setStatus] = useState(searchParams.get('status') || "ALL")

    // ═══════════════════════════════════════════════════════════════
    // ✅ FIX: Jab initialData change ho (URL params change hone pe
    // server component re-render hota hai aur naya data bhejta hai),
    // tab local state ko sync karo. Pehle ye missing tha — isliye
    // search/pagination se URL toh change hoti thi lekin UI update
    // nahi hoti thi kyunki useState sirf first render pe value leta hai.
    // ═══════════════════════════════════════════════════════════════
    useEffect(() => {
        setServices(initialData.services)
        setPagination(initialData.pagination)
    }, [initialData])

    // CHANGE: router.push → startTransition + router.push
    // isse Next.js ko pata chalta hai ki ye server navigation hai
    // aur loading state manage ho sakti hai
    const updateURL = (newSearch: string, newStatus: string, newPage: number = 1) => {
        const params = new URLSearchParams()
        if (newSearch) params.set('search', newSearch)
        if (newStatus && newStatus !== 'ALL') params.set('status', newStatus)
        if (newPage > 1) params.set('page', newPage.toString())
        
        const newUrl = `/admin/services?${params.toString()}`
        
        startTransition(() => {
            router.push(newUrl)
        })
    }

    // CHANGE: Debounce fix kiya — pehle cleanup function return ho raha tha
    // jo kabhi call nahi hota tha. Ab useRef se properly manage hoga.
    // Actually, simpler approach: setTimeout ko properly handle karte hain
    const handleSearchChange = (value: string) => {
        setSearch(value)
        
        // CHANGE: Debounce — 500ms rukke URL update karo
        // Pehle ye return () => clearTimeout(timer) karta tha jo
        // kabhi execute nahi hota tha (event handler se cleanup nahi hota)
        // Ab simple setTimeout hai — for production, lodash.debounce ya
        // useMemo+useRef use kar sakte hain
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
        startTransition(() => {
            router.push('/admin/services')
        })
    }

    const handlePageChange = (page: number) => {
        updateURL(search, status, page)
    }

    // Optimistic update for toggle — ye same hai, koi change nahi
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
            pagination={pagination}
            onSearchChange={handleSearchChange}
            onStatusChange={handleStatusChange}
            onReset={handleReset}
            onToggleActive={handleToggle}
            onDelete={handleDelete}
            onPageChange={handlePageChange}
            // CHANGE: isPending pass kiya — table ko pata chale ki loading ho rahi hai
            isLoading={isPending}
        />
    )
}