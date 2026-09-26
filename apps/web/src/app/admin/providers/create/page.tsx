// app/admin/providers/create/page.tsx

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Loader2, Save } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { apiFetch } from "@/lib/api-client"

export default function CreateProviderPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        email: "",
        password: "",
        experience: "0",
        bio: "",
        commissionRate: "15",
        aadharNumber: "",
        panNumber: ""
    })

    const generatePassword = () => {
        const password = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-4).toUpperCase()
        setFormData({ ...formData, password })
        toast.success("Password generated!")
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        
        // Validation
        if (!formData.name || !formData.phone || !formData.password) {
            toast.error("Name, phone, and password are required")
            return
        }

        if (formData.phone.length !== 10) {
            toast.error("Phone number must be 10 digits")
            return
        }

        if (formData.password.length < 6) {
            toast.error("Password must be at least 6 characters")
            return
        }

        setLoading(true)

        try {
            const res = await apiFetch('/api/admin/providers/create', {
                method: 'POST',
                body: JSON.stringify({
                    ...formData,
                    experience: parseInt(formData.experience),
                    commissionRate: parseFloat(formData.commissionRate)
                })
            })

            if (!res || !res.ok) {
                toast.error("Failed to create provider")
                return
            }

            const data = await res.json()

            if (data.success) {
                toast.success("Provider created successfully!")
                router.push('/admin/providers')
            } else {
                toast.error(data.error || "Failed to create provider")
            }
        } catch (error) {
            console.error('Create provider error:', error)
            toast.error("Something went wrong")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="p-6 space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-4">
                <Button asChild variant="ghost" size="icon">
                    <Link href="/admin/providers">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Add Provider Manually</h1>
                    <p className="text-muted-foreground">Create a new provider account</p>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <Card>
                    <CardHeader>
                        <CardTitle>Provider Information</CardTitle>
                        <CardDescription>
                            Fill in the provider details. Password will be sent via SMS.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Personal Details */}
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name *</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="John Doe"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone Number *</Label>
                                <Input
                                    id="phone"
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })}
                                    placeholder="9876543210"
                                    maxLength={10}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email (Optional)</Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                placeholder="john@example.com"
                            />
                        </div>

                        {/* Password */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password">Password *</Label>
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={generatePassword}
                                >
                                    Generate Random
                                </Button>
                            </div>
                            <Input
                                id="password"
                                type="text"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                placeholder="Min 6 characters"
                                required
                            />
                            <p className="text-xs text-muted-foreground">
                                Provider will receive this password via SMS
                            </p>
                        </div>

                        {/* Professional Details */}
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="experience">Years of Experience</Label>
                                <Input
                                    id="experience"
                                    type="number"
                                    value={formData.experience}
                                    onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                                    min="0"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="commission">Commission Rate (%)</Label>
                                <Input
                                    id="commission"
                                    type="number"
                                    value={formData.commissionRate}
                                    onChange={(e) => setFormData({ ...formData, commissionRate: e.target.value })}
                                    min="0"
                                    max="100"
                                    step="0.5"
                                />
                            </div>
                        </div>

                        {/* Documents */}
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="aadhar">Aadhar Number</Label>
                                <Input
                                    id="aadhar"
                                    value={formData.aadharNumber}
                                    onChange={(e) => setFormData({ ...formData, aadharNumber: e.target.value })}
                                    placeholder="1234 5678 9012"
                                    maxLength={12}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="pan">PAN Number</Label>
                                <Input
                                    id="pan"
                                    value={formData.panNumber}
                                    onChange={(e) => setFormData({ ...formData, panNumber: e.target.value.toUpperCase() })}
                                    placeholder="ABCDE1234F"
                                    maxLength={10}
                                />
                            </div>
                        </div>

                        {/* Bio */}
                        <div className="space-y-2">
                            <Label htmlFor="bio">About / Bio</Label>
                            <Textarea
                                id="bio"
                                value={formData.bio}
                                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                placeholder="Brief description about the provider..."
                                rows={4}
                            />
                        </div>

                        {/* Submit */}
                        <div className="flex gap-3 justify-end">
                            <Button 
                                type="button" 
                                variant="outline" 
                                onClick={() => router.back()}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        Create Provider
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </form>
        </div>
    )
}