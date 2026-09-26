"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Save, User, MapPin } from "lucide-react"
import { toast } from "sonner"
import { apiFetch } from "@/lib/api-client"

interface ProfileFormProps {
    initialData: any
}

export function ProfileForm({ initialData }: ProfileFormProps) {
    const [loading, setLoading] = useState(false)
    const [name, setName] = useState(initialData?.user?.name || "")
    const [email, setEmail] = useState(initialData?.user?.email || "")
    const [bio, setBio] = useState(initialData?.bio || "")
    const [experience, setExperience] = useState(initialData?.experience?.toString() || "0")
    const [isAvailable, setIsAvailable] = useState(initialData?.isAvailable || false)
    const [serviceAreas, setServiceAreas] = useState(initialData?.serviceAreas?.join(", ") || "")

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            // ✅ FIX: Response leke phir .json() call karo
            const res = await apiFetch('/api/provider/profile', {
                method: 'PUT',
                body: JSON.stringify({
                    name, email, bio, experience, isAvailable,
                    serviceAreas: serviceAreas.split(',').map((s: string) => s.trim()).filter(Boolean)
                })
            })
            
            const data = await res.json()
            
            if (data.success) toast.success("Profile updated!")
            else toast.error(data.error)
        } catch (error) { 
            console.error("Profile update error:", error)
            toast.error("Failed to update") 
        }
        finally { setLoading(false) }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><User className="h-5 w-5" /> Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label>Full Name</Label>
                        <Input value={name} onChange={(e) => setName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label>Email</Label>
                        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                        <Label>Bio / About You</Label>
                        <Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} placeholder="Tell customers about your experience..." />
                    </div>
                    <div className="space-y-2">
                        <Label>Years of Experience</Label>
                        <Input type="number" value={experience} onChange={(e) => setExperience(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Service Areas (comma separated)</Label>
                        <Input value={serviceAreas} onChange={(e) => setServiceAreas(e.target.value)} placeholder="Ambikapur, Surguja, etc." />
                    </div>
                    <div className="flex items-center space-x-2 md:col-span-2">
                        <Switch id="available" checked={isAvailable} onCheckedChange={setIsAvailable} />
                        <Label htmlFor="available">Available for new bookings</Label>
                    </div>
                </CardContent>
            </Card>

            <Button type="submit" disabled={loading} className="w-full md:w-auto">
                <Save className="h-4 w-4 mr-2" /> {loading ? 'Saving...' : 'Save Profile'}
            </Button>
        </form>
    )
}