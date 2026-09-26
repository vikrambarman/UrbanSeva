"use client"

import { useEffect, useState } from "react"
import { DocumentUpload } from "@/components/provider/DocumentUpload"
import { apiFetch } from "@/lib/api-client"
import { toast } from "sonner"

export default function ProviderDocumentsPage() {
    const [documents, setDocuments] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
    const fetchDocs = async () => {
        try {
            // ✅ FIX: Response object milega
            const res = await apiFetch('/api/provider/documents')
            // ✅ FIX: Parse karo
            const data = await res.json()
            
            if (data.success) setDocuments(data.data)
            else toast.error(data.error)
        } catch (error) { 
            console.error("Documents fetch error:", error)
            toast.error("Failed to load documents") 
        }
        finally { setLoading(false) }
    }
    fetchDocs()
}, [])

    if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>

    return (
        <div className="p-6 space-y-6 max-w-4xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Documents & Verification</h1>
                <p className="text-muted-foreground">Upload and manage your identity documents.</p>
            </div>
            {documents && <DocumentUpload initialData={documents} />}
        </div>
    )
}