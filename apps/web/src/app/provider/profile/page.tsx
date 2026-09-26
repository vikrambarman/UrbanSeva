"use client"

import { useEffect, useState } from "react"
import { ProfileForm } from "@/components/provider/ProfileForm"
import { apiFetch } from "@/lib/api-client"
import { toast } from "sonner"

export default function ProviderProfilePage() {
    const [profile, setProfile] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
    const fetchProfile = async () => {
        try {
            // ✅ FIX: Response object milega
            const res = await apiFetch('/api/provider/profile')
            // ✅ FIX: Parse karo
            const data = await res.json()
            
            if (data.success) setProfile(data.data)
            else toast.error(data.error)
        } catch (error) { 
            console.error("Profile fetch error:", error)
            toast.error("Failed to load profile") 
        }
        finally { setLoading(false) }
    }
    fetchProfile()
}, [])

    if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>

    return (
        <div className="p-6 space-y-6 max-w-4xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
                <p className="text-muted-foreground">Manage your personal information and availability.</p>
            </div>
            {profile && <ProfileForm initialData={profile} />}
        </div>
    )
}