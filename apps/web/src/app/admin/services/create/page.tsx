"use client"

import { useEffect, useState } from "react"
import { ServiceForm } from "@/components/admin/ServiceForm"
import { toast } from "sonner"
import { apiFetch } from "@/lib/api-client"

export default function CreateServicePage() {
    const [categories, setCategories] = useState<any[]>([])

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                // Assuming you have a public or admin API to fetch categories with subcategories
                const res = await apiFetch('/api/categories') // Adjust endpoint if needed
                const data = await res.json()
                if (data.success) setCategories(data.data)
            } catch { toast.error("Failed to load categories") }
        }
        fetchCategories()
    }, [])

    return (
        <div className="p-6 space-y-6 max-w-5xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Create New Service</h1>
                <p className="text-muted-foreground">Add a new service to the marketplace.</p>
            </div>
            <ServiceForm categories={categories} />
        </div>
    )
}