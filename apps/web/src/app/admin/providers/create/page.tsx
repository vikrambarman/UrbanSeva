"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft, Loader2, Save, Wrench, Check } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { apiFetch } from "@/lib/api-client"

interface Category {
    id: string
    name: string
    slug: string
}

interface Service {
    id: string
    name: string
    slug: string
    image: string | null
    basePrice: number
}

export default function CreateProviderPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    
    const [categories, setCategories] = useState<Category[]>([])
    const [services, setServices] = useState<Service[]>([])
    const [selectedCategory, setSelectedCategory] = useState<string>('')
    const [selectedServices, setSelectedServices] = useState<string[]>([])
    const [loadingCategories, setLoadingCategories] = useState(true)
    const [loadingServices, setLoadingServices] = useState(false)

    // CHANGE: commissionRate hata diya formData se
    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        email: "",
        password: "",
        experience: "0",
        bio: "",
        aadharNumber: "",
        panNumber: ""
    })

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await apiFetch('/api/categories')
                const data = await res.json()
                if (data.success) {
                    setCategories(data.data)
                }
            } catch (error) {
                console.error('Failed to fetch categories:', error)
            } finally {
                setLoadingCategories(false)
            }
        }
        fetchCategories()
    }, [])

    useEffect(() => {
        if (!selectedCategory) {
            setServices([])
            return
        }

        const fetchServices = async () => {
            setLoadingServices(true)
            try {
                const res = await apiFetch(`/api/categories/${selectedCategory}`)
                const data = await res.json()
                if (data.success) {
                    const allServices: Service[] = []
                    data.data.subCategories?.forEach((subCat: any) => {
                        subCat.services?.forEach((service: any) => {
                            allServices.push({
                                id: service.id,
                                name: service.name,
                                slug: service.slug,
                                image: service.image,
                                basePrice: service.basePrice
                            })
                        })
                    })
                    setServices(allServices)
                }
            } catch (error) {
                console.error('Failed to fetch services:', error)
                toast.error('Failed to load services')
            } finally {
                setLoadingServices(false)
            }
        }
        fetchServices()
    }, [selectedCategory])

    const generatePassword = () => {
        const password = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-4).toUpperCase()
        setFormData({ ...formData, password })
        toast.success("Password generated!")
    }

    const toggleService = (serviceId: string) => {
        setSelectedServices(prev => 
            prev.includes(serviceId)
                ? prev.filter(id => id !== serviceId)
                : [...prev, serviceId]
        )
    }

    const selectAllServices = () => {
        if (selectedServices.length === services.length) {
            setSelectedServices([])
        } else {
            setSelectedServices(services.map(s => s.id))
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        
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

        if (selectedServices.length === 0) {
            toast.error("Please select at least one service for this provider")
            return
        }

        setLoading(true)

        try {
            // CHANGE: commissionRate hata diya body se
            const res = await apiFetch('/api/admin/providers/create', {
                method: 'POST',
                body: JSON.stringify({
                    ...formData,
                    experience: parseInt(formData.experience),
                    serviceIds: selectedServices,
                })
            })

            if (!res || !res.ok) {
                const errorData = await res.json().catch(() => ({}))
                toast.error(errorData.error || "Failed to create provider")
                return
            }

            const data = await res.json()

            if (data.success) {
                toast.success("Provider created successfully with services!")
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
        <div className="p-6 space-y-6 max-w-5xl mx-auto">
            <div className="flex items-center gap-4">
                <Button asChild variant="ghost" size="icon">
                    <Link href="/admin/providers">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Add Provider Manually</h1>
                    <p className="text-muted-foreground">Create a new provider account and assign services</p>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="grid lg:grid-cols-2 gap-6">
                    {/* Left Column — Basic Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Provider Information</CardTitle>
                            <CardDescription>
                                Fill in the provider details. Password will be sent via SMS.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
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

                            {/* CHANGE: Commission rate hata diya, sirf experience rakha */}
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

                            <div className="space-y-2">
                                <Label htmlFor="bio">About / Bio</Label>
                                <Textarea
                                    id="bio"
                                    value={formData.bio}
                                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                    placeholder="Brief description about the provider..."
                                    rows={3}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Right Column — Services Assignment */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Wrench className="h-5 w-5 text-primary" />
                                Assign Services *
                            </CardTitle>
                            <CardDescription>
                                Select category and assign services this provider can perform
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Service Category *</Label>
                                {loadingCategories ? (
                                    <Skeleton className="h-10 w-full" />
                                ) : (
                                    <Select value={selectedCategory} onValueChange={(val) => {
                                        setSelectedCategory(val)
                                        setSelectedServices([])
                                    }}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories.map((cat) => (
                                                <SelectItem key={cat.id} value={cat.id}>
                                                    {cat.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            </div>

                            {selectedCategory && (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Label>Available Services</Label>
                                        {services.length > 0 && (
                                            <Button 
                                                type="button" 
                                                variant="ghost" 
                                                size="sm"
                                                onClick={selectAllServices}
                                            >
                                                {selectedServices.length === services.length ? 'Deselect All' : 'Select All'}
                                            </Button>
                                        )}
                                    </div>

                                    {loadingServices ? (
                                        <div className="space-y-2">
                                            {[...Array(4)].map((_, i) => (
                                                <Skeleton key={i} className="h-14 w-full" />
                                            ))}
                                        </div>
                                    ) : services.length === 0 ? (
                                        <div className="text-center py-6 border rounded-lg">
                                            <p className="text-sm text-muted-foreground">
                                                No services available for this category
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="max-h-80 overflow-y-auto space-y-2 border rounded-lg p-3">
                                            {services.map((service) => (
                                                <div
                                                    key={service.id}
                                                    className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                                                        selectedServices.includes(service.id)
                                                            ? 'border-primary bg-primary/5'
                                                            : 'hover:bg-muted'
                                                    }`}
                                                >
                                                    <Checkbox
                                                        id={`service-${service.id}`}
                                                        checked={selectedServices.includes(service.id)}
                                                        onCheckedChange={() => toggleService(service.id)}
                                                    />
                                                    {service.image && (
                                                        <img 
                                                            src={service.image} 
                                                            alt={service.name}
                                                            className="h-10 w-10 rounded object-cover flex-shrink-0"
                                                        />
                                                    )}
                                                    <label 
                                                        htmlFor={`service-${service.id}`}
                                                        className="flex-1 min-w-0 cursor-pointer"
                                                    >
                                                        <p className="text-sm font-medium truncate">
                                                            {service.name}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            Base Price: ₹{service.basePrice}
                                                        </p>
                                                    </label>
                                                    {selectedServices.includes(service.id) && (
                                                        <Check className="h-4 w-4 text-primary flex-shrink-0" />
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {selectedServices.length > 0 && (
                                        <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg">
                                            <Check className="h-4 w-4 text-primary" />
                                            <p className="text-sm font-medium text-primary">
                                                {selectedServices.length} service(s) selected
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {!selectedCategory && (
                                <div className="text-center py-8 border rounded-lg">
                                    <Wrench className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                                    <p className="text-sm text-muted-foreground">
                                        Select a category to view available services
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="flex gap-3 justify-end mt-6">
                    <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => router.back()}
                    >
                        Cancel
                    </Button>
                    <Button 
                        type="submit" 
                        disabled={loading || selectedServices.length === 0}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Creating...
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                Create Provider ({selectedServices.length} services)
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    )
}