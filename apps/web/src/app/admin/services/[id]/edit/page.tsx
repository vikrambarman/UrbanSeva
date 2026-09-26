"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { ServiceForm } from "@/components/admin/ServiceForm"
import { toast } from "sonner"
import { apiFetch } from "@/lib/api-client"

export default function EditServicePage() {
    const params = useParams()
    const [service, setService] = useState<any>(null)
    const [categories, setCategories] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [serviceRes, catRes] = await Promise.all([
                    apiFetch(`/api/admin/services/${params.id}`),
                    apiFetch('/api/categories') // Adjust endpoint if needed
                ])
                const serviceData = await serviceRes.json()
                const catData = await catRes.json()
                
                if (serviceData.success) setService(serviceData.data)
                else toast.error("Service not found")
                
                if (catData.success) setCategories(catData.data)
            } catch { toast.error("Failed to load data") } 
            finally { setLoading(false) }
        }
        fetchData()
    }, [params.id])

    if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
    if (!service) return <div className="p-6 text-center text-destructive">Service not found.</div>

    return (
        <div className="p-6 space-y-6 max-w-5xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Edit Service</h1>
                <p className="text-muted-foreground">Update details for {service.name}</p>
            </div>
            <ServiceForm initialData={service} categories={categories} />
        </div>
    )
}