// apps/web/src/app/admin/providers/[id]/page.tsx
// CHANGE: "Assigned Services" tab mein Add/Remove/Edit functionality add ki
// CHANGE: Modal for adding new services with category selection
// CHANGE: Remove button for each service
// WHY: Provider banne ke baad bhi services add/remove kar sake

"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
    Dialog, DialogContent, DialogDescription, DialogFooter,
    DialogHeader, DialogTitle
} from "@/components/ui/dialog"
import {
    ArrowLeft, CheckCircle, XCircle, FileText, Star, Wallet, Briefcase,
    Plus, Trash2, Edit, Wrench, Check
} from "lucide-react"
import { toast } from "sonner"
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

interface ProviderService {
    id: string
    customPrice: number | null
    isActive: boolean
    service: {
        id: string
        name: string
        slug: string
        image: string | null
        basePrice: number
        subCategory: {
            name: string
            category: {
                name: string
            }
        }
    }
}

export default function AdminProviderDetailPage() {
    const params = useParams()
    const router = useRouter()
    const [provider, setProvider] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [commission, setCommission] = useState(0)

    // Services management
    const [providerServices, setProviderServices] = useState<ProviderService[]>([])
    const [loadingServices, setLoadingServices] = useState(true)
    const [addServiceModal, setAddServiceModal] = useState(false)
    const [categories, setCategories] = useState<Category[]>([])
    const [availableServices, setAvailableServices] = useState<Service[]>([])
    const [selectedCategory, setSelectedCategory] = useState('')
    const [selectedServices, setSelectedServices] = useState<string[]>([])
    const [loadingCategories, setLoadingCategories] = useState(false)
    const [loadingAvailableServices, setLoadingAvailableServices] = useState(false)
    const [addingServices, setAddingServices] = useState(false)

    useEffect(() => {
        const fetchProvider = async () => {
            try {
                const res = await apiFetch(`/api/admin/providers/${params.id}`)
                
                if (!res || !res.ok) {
                    toast.error("Failed to fetch provider details")
                    router.push('/admin/providers')
                    return
                }
                
                const data = await res.json()
                
                if (data.success) {
                    setProvider(data.data)
                    setCommission(data.data.commissionRate)
                } else {
                    toast.error(data.error)
                    router.push('/admin/providers')
                }
            } catch (error) {
                console.error('Provider fetch error:', error)
                toast.error("Failed to fetch details")
                router.push('/admin/providers')
            } finally {
                setLoading(false)
            }
        }
        fetchProvider()
        fetchProviderServices()
    }, [params.id, router])

    const fetchProviderServices = async () => {
        setLoadingServices(true)
        try {
            const res = await apiFetch(`/api/admin/providers/${params.id}/services`)
            const data = await res.json()
            if (data.success) {
                setProviderServices(data.data)
            }
        } catch (error) {
            console.error('Failed to fetch services:', error)
        } finally {
            setLoadingServices(false)
        }
    }

    const fetchCategories = async () => {
        setLoadingCategories(true)
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

    const fetchServicesForCategory = async (categoryId: string) => {
        setLoadingAvailableServices(true)
        try {
            const res = await apiFetch(`/api/categories/${categoryId}`)
            const data = await res.json()
            if (data.success) {
                const allServices: Service[] = []
                data.data.subCategories?.forEach((subCat: any) => {
                    subCat.services?.forEach((service: any) => {
                        // Only show services not already assigned
                        if (!providerServices.some(ps => ps.service.id === service.id)) {
                            allServices.push({
                                id: service.id,
                                name: service.name,
                                slug: service.slug,
                                image: service.image,
                                basePrice: service.basePrice
                            })
                        }
                    })
                })
                setAvailableServices(allServices)
            }
        } catch (error) {
            console.error('Failed to fetch services:', error)
        } finally {
            setLoadingAvailableServices(false)
        }
    }

    const handleOpenAddServiceModal = () => {
        setAddServiceModal(true)
        setSelectedCategory('')
        setSelectedServices([])
        setAvailableServices([])
        fetchCategories()
    }

    const handleCategoryChange = (categoryId: string) => {
        setSelectedCategory(categoryId)
        setSelectedServices([])
        if (categoryId) {
            fetchServicesForCategory(categoryId)
        }
    }

    const toggleService = (serviceId: string) => {
        setSelectedServices(prev =>
            prev.includes(serviceId)
                ? prev.filter(id => id !== serviceId)
                : [...prev, serviceId]
        )
    }

    const handleAddServices = async () => {
        if (selectedServices.length === 0) {
            toast.error('Please select at least one service')
            return
        }

        setAddingServices(true)
        try {
            const res = await apiFetch(`/api/admin/providers/${params.id}/services`, {
                method: 'POST',
                body: JSON.stringify({ serviceIds: selectedServices })
            })
            const data = await res.json()
            if (data.success) {
                toast.success(data.message)
                setAddServiceModal(false)
                fetchProviderServices()
            } else {
                toast.error(data.error || 'Failed to add services')
            }
        } catch (error) {
            console.error('Add services error:', error)
            toast.error('Failed to add services')
        } finally {
            setAddingServices(false)
        }
    }

    const handleRemoveService = async (serviceId: string) => {
        if (!confirm('Are you sure you want to remove this service?')) return

        try {
            const res = await apiFetch(`/api/admin/providers/${params.id}/services?serviceId=${serviceId}`, {
                method: 'DELETE'
            })
            const data = await res.json()
            if (data.success) {
                toast.success('Service removed')
                fetchProviderServices()
            } else {
                toast.error(data.error || 'Failed to remove service')
            }
        } catch (error) {
            console.error('Remove service error:', error)
            toast.error('Failed to remove service')
        }
    }

    const handleApprove = async () => {
        try {
            const res = await apiFetch(`/api/admin/providers/${params.id}/approve`, { 
                method: 'POST' 
            })
            
            if (!res || !res.ok) {
                toast.error("Failed to approve")
                return
            }
            
            const data = await res.json()
            if (data.success) {
                toast.success("Provider approved successfully")
                setProvider({ ...provider, status: 'APPROVED' })
            } else {
                toast.error(data.error)
            }
        } catch (error) {
            console.error('Approve error:', error)
            toast.error("Failed to approve")
        }
    }

    const handleReject = async () => {
        try {
            const res = await apiFetch(`/api/admin/providers/${params.id}/reject`, { 
                method: 'POST' 
            })
            
            if (!res || !res.ok) {
                toast.error("Failed to reject")
                return
            }
            
            const data = await res.json()
            if (data.success) {
                toast.success("Provider rejected")
                setProvider({ ...provider, status: 'REJECTED' })
            } else {
                toast.error(data.error)
            }
        } catch (error) {
            console.error('Reject error:', error)
            toast.error("Failed to reject")
        }
    }

    const updateCommission = async () => {
        try {
            const res = await apiFetch(`/api/admin/providers/${params.id}`, {
                method: 'PUT',
                body: JSON.stringify({ commissionRate: commission })
            })
            
            if (!res || !res.ok) {
                toast.error("Failed to update commission")
                return
            }
            
            const data = await res.json()
            if (data.success) {
                toast.success("Commission updated successfully")
                setProvider({ ...provider, commissionRate: commission })
            } else {
                toast.error(data.error)
            }
        } catch (error) {
            console.error('Commission update error:', error)
            toast.error("Failed to update commission")
        }
    }

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        )
    }

    if (!provider) return null

    return (
        <div className="p-6 space-y-6">
            <Button 
                variant="ghost" 
                onClick={() => router.push('/admin/providers')} 
                className="mb-4"
            >
                <ArrowLeft className="h-4 w-4 mr-2" /> Back to Providers
            </Button>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold">{provider.user.name || "Unnamed Provider"}</h1>
                    <p className="text-muted-foreground">
                        {provider.user.phone} • {provider.user.email}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Badge 
                        variant={
                            provider.status === 'APPROVED' ? 'default' : 
                            provider.status === 'REJECTED' ? 'destructive' : 
                            'secondary'
                        } 
                        className="text-sm px-3 py-1"
                    >
                        {provider.status}
                    </Badge>
                    {provider.status === 'PENDING' && (
                        <>
                            <Button 
                                size="sm" 
                                onClick={handleApprove} 
                                className="bg-green-600 hover:bg-green-700"
                            >
                                <CheckCircle className="h-4 w-4 mr-1" /> Approve
                            </Button>
                            <Button 
                                size="sm" 
                                variant="destructive" 
                                onClick={handleReject}
                            >
                                <XCircle className="h-4 w-4 mr-1" /> Reject
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold flex items-center gap-2">
                            <Wallet className="h-5 w-5 text-green-600" />
                            ₹{provider.totalEarnings || 0}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold flex items-center gap-2">
                            <Briefcase className="h-5 w-5 text-blue-600" />
                            {provider.totalJobs || 0}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold flex items-center gap-2">
                            <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                            {provider.avgRating?.toFixed(1) || '0.0'}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2 flex flex-row items-center justify-between">
                        <CardTitle className="text-sm font-medium">Commission %</CardTitle>
                    </CardHeader>
                    <CardContent className="flex gap-2">
                        <Input 
                            type="number" 
                            value={commission} 
                            onChange={(e) => setCommission(Number(e.target.value))} 
                            className="h-8" 
                        />
                        <Button size="sm" onClick={updateCommission}>Save</Button>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs for Details */}
            <Tabs defaultValue="documents" className="w-full">
                <TabsList>
                    <TabsTrigger value="documents">Documents</TabsTrigger>
                    <TabsTrigger value="services">
                        Assigned Services ({providerServices.length})
                    </TabsTrigger>
                    <TabsTrigger value="earnings">Recent Earnings</TabsTrigger>
                    <TabsTrigger value="payouts">Recent Payouts</TabsTrigger>
                </TabsList>
                
                <TabsContent value="documents" className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                        <Card>
                            <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-4 w-4" /> Aadhar Card</CardTitle></CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-2">Number: {provider.aadharNumber || 'N/A'}</p>
                                {provider.aadharImage ? (
                                    <img src={provider.aadharImage} alt="Aadhar" className="w-full h-48 object-cover rounded-md border" />
                                ) : <p className="text-sm text-destructive">Not uploaded</p>}
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-4 w-4" /> PAN Card</CardTitle></CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-2">Number: {provider.panNumber || 'N/A'}</p>
                                {provider.panImage ? (
                                    <img src={provider.panImage} alt="PAN" className="w-full h-48 object-cover rounded-md border" />
                                ) : <p className="text-sm text-destructive">Not uploaded</p>}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="services">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Assigned Services ({providerServices.length})</CardTitle>
                            <Button size="sm" onClick={handleOpenAddServiceModal}>
                                <Plus className="h-4 w-4 mr-1" />
                                Add Services
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {loadingServices ? (
                                <div className="grid md:grid-cols-3 gap-4">
                                    {[...Array(6)].map((_, i) => (
                                        <Skeleton key={i} className="h-20 w-full" />
                                    ))}
                                </div>
                            ) : providerServices.length === 0 ? (
                                <div className="text-center py-8">
                                    <Wrench className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                                    <p className="text-muted-foreground mb-4">No services assigned yet</p>
                                    <Button onClick={handleOpenAddServiceModal}>
                                        <Plus className="h-4 w-4 mr-1" />
                                        Add Services
                                    </Button>
                                </div>
                            ) : (
                                <div className="grid md:grid-cols-3 gap-4">
                                    {providerServices.map((ps) => (
                                        <div key={ps.id} className="flex items-start gap-3 p-4 border rounded-lg hover:border-primary/50 transition-all group">
                                            {ps.service.image && (
                                                <img 
                                                    src={ps.service.image} 
                                                    alt={ps.service.name} 
                                                    className="w-12 h-12 rounded object-cover flex-shrink-0" 
                                                />
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-sm truncate">{ps.service.name}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {ps.service.subCategory.category.name}
                                                </p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    {ps.customPrice ? (
                                                        <span className="text-xs font-medium text-primary">
                                                            Custom: ₹{ps.customPrice}
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground">
                                                            Default: ₹{ps.service.basePrice}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive"
                                                onClick={() => handleRemoveService(ps.service.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="earnings">
                    <Card>
                        <CardHeader><CardTitle>Recent Earnings</CardTitle></CardHeader>
                        <CardContent>
                            {provider.earnings?.length > 0 ? (
                                <div className="space-y-2">
                                    {provider.earnings.map((e: any) => (
                                        <div key={e.id} className="flex justify-between p-3 border rounded-md">
                                            <div>
                                                <p className="font-medium">Gross: ₹{e.gross} | Net: ₹{e.net}</p>
                                                <p className="text-xs text-muted-foreground">Commission: ₹{e.commission}</p>
                                            </div>
                                            <Badge variant={e.status === 'PAID' ? 'default' : 'secondary'}>{e.status}</Badge>
                                        </div>
                                    ))}
                                </div>
                            ) : <p className="text-muted-foreground">No earnings yet.</p>}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="payouts">
                    <Card>
                        <CardHeader><CardTitle>Recent Payouts</CardTitle></CardHeader>
                        <CardContent>
                            {provider.payouts?.length > 0 ? (
                                <div className="space-y-2">
                                    {provider.payouts.map((p: any) => (
                                        <div key={p.id} className="flex justify-between p-3 border rounded-md">
                                            <div>
                                                <p className="font-medium">₹{p.amount} via {p.method}</p>
                                                <p className="text-xs text-muted-foreground">{new Date(p.createdAt).toLocaleDateString()}</p>
                                            </div>
                                            <Badge variant={p.status === 'COMPLETED' ? 'default' : 'secondary'}>{p.status}</Badge>
                                        </div>
                                    ))}
                                </div>
                            ) : <p className="text-muted-foreground">No payouts yet.</p>}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Add Services Modal */}
            <Dialog open={addServiceModal} onOpenChange={setAddServiceModal}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Add Services to Provider</DialogTitle>
                        <DialogDescription>
                            Select category and choose services to assign
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        {/* Category Selection */}
                        <div className="space-y-2">
                            <Label>Service Category</Label>
                            {loadingCategories ? (
                                <Skeleton className="h-10 w-full" />
                            ) : (
                                <Select value={selectedCategory} onValueChange={handleCategoryChange}>
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

                        {/* Services Selection */}
                        {selectedCategory && (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label>Available Services</Label>
                                    {availableServices.length > 0 && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                if (selectedServices.length === availableServices.length) {
                                                    setSelectedServices([])
                                                } else {
                                                    setSelectedServices(availableServices.map(s => s.id))
                                                }
                                            }}
                                        >
                                            {selectedServices.length === availableServices.length ? 'Deselect All' : 'Select All'}
                                        </Button>
                                    )}
                                </div>

                                {loadingAvailableServices ? (
                                    <div className="space-y-2">
                                        {[...Array(4)].map((_, i) => (
                                            <Skeleton key={i} className="h-14 w-full" />
                                        ))}
                                    </div>
                                ) : availableServices.length === 0 ? (
                                    <div className="text-center py-6 border rounded-lg">
                                        <p className="text-sm text-muted-foreground">
                                            No services available or all services already assigned
                                        </p>
                                    </div>
                                ) : (
                                    <div className="max-h-64 overflow-y-auto space-y-2 border rounded-lg p-3">
                                        {availableServices.map((service) => (
                                            <div
                                                key={service.id}
                                                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                                                    selectedServices.includes(service.id)
                                                        ? 'border-primary bg-primary/5'
                                                        : 'hover:bg-muted'
                                                }`}
                                                onClick={() => toggleService(service.id)}
                                            >
                                                <Checkbox
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
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium truncate">{service.name}</p>
                                                    <p className="text-xs text-muted-foreground">Base Price: ₹{service.basePrice}</p>
                                                </div>
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
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAddServiceModal(false)}>
                            Cancel
                        </Button>
                        <Button 
                            onClick={handleAddServices} 
                            disabled={addingServices || selectedServices.length === 0}
                        >
                            {addingServices ? 'Adding...' : `Add ${selectedServices.length} Service(s)`}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}