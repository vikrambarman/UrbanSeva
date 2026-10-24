"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import {
    ArrowLeft, CheckCircle, XCircle, FileText, Star, Wallet, Briefcase,
    Phone, Mail, User, Plus, Trash2, Search, Loader2, ChevronRight, ChevronLeft
} from "lucide-react"
import { toast } from "sonner"
import { useAuthStore } from "@/store/authStore"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

export default function OpsProviderDetailPage() {
    const params = useParams()
    const router = useRouter()
    const { token } = useAuthStore()
    const [provider, setProvider] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    // Service assignment modal states
    const [isAddServiceOpen, setIsAddServiceOpen] = useState(false)
    const [assignmentStep, setAssignmentStep] = useState<'categories' | 'subcategories' | 'services' | 'assign'>('categories')
    const [categories, setCategories] = useState<any[]>([])
    const [selectedCategory, setSelectedCategory] = useState<any>(null)
    const [selectedSubCategory, setSelectedSubCategory] = useState<any>(null)
    const [selectedService, setSelectedService] = useState<any>(null)
    const [customPrice, setCustomPrice] = useState('')
    const [serviceNotes, setServiceNotes] = useState('')
    const [isAssigning, setIsAssigning] = useState(false)
    const [isRemoving, setIsRemoving] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [isLoadingCategories, setIsLoadingCategories] = useState(false)

    useEffect(() => {
        const fetchProvider = async () => {
            try {
                const res = await fetch(`/api/ops/providers/${params.id}`, {
                    cache: 'no-store',
                    headers: { 'Authorization': `Bearer ${token}` }
                })
                const data = await res.json()
                if (data.success) {
                    setProvider(data.data)
                } else {
                    toast.error(data.error || 'Failed to fetch details')
                    router.push('/ops/providers')
                }
            } catch (error) {
                toast.error("Failed to fetch details")
                router.push('/ops/providers')
            } finally {
                setLoading(false)
            }
        }
        fetchProvider()
    }, [params.id, router, token])

    const fetchCategories = async () => {
        setIsLoadingCategories(true)
        try {
            const res = await fetch(`/api/ops/services/list?search=${searchQuery}`, {
                cache: 'no-store',
                headers: { 'Authorization': `Bearer ${token}` }
            })
            const data = await res.json()
            if (data.success) {
                setCategories(data.data)
            }
        } catch (error) {
            console.error('Failed to fetch categories', error)
        } finally {
            setIsLoadingCategories(false)
        }
    }

    useEffect(() => {
        if (isAddServiceOpen && assignmentStep === 'categories') {
            fetchCategories()
        }
    }, [isAddServiceOpen, assignmentStep, searchQuery])

    const handleAction = async (action: 'APPROVE' | 'REJECT') => {
        try {
            const res = await fetch(`/api/ops/providers/${params.id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ action })
            })
            const data = await res.json()
            if (data.success) {
                toast.success(data.message || `Provider ${action === 'APPROVE' ? 'approved' : 'rejected'} successfully`)
                setProvider({ ...provider, status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED' })
            } else {
                toast.error(data.error || 'Failed to update provider')
            }
        } catch (error) {
            toast.error("Failed to update provider")
        }
    }

    const handleAssignService = async () => {
        if (!selectedService) {
            toast.error('Please select a service')
            return
        }

        setIsAssigning(true)
        try {
            const res = await fetch(`/api/ops/providers/${params.id}/services`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    serviceId: selectedService.id,
                    customPrice: customPrice ? parseFloat(customPrice) : null,
                    notes: serviceNotes || null,
                })
            })
            const data = await res.json()
            if (data.success) {
                toast.success(data.message || 'Service assigned successfully')
                setProvider({
                    ...provider,
                    services: [...(provider.services || []), data.data]
                })
                resetModal()
            } else {
                toast.error(data.error || 'Failed to assign service')
            }
        } catch (error) {
            toast.error("Failed to assign service")
        } finally {
            setIsAssigning(false)
        }
    }

    const handleRemoveService = async (serviceId: string) => {
        if (!confirm('Are you sure you want to remove this service?')) return

        setIsRemoving(serviceId)
        try {
            const res = await fetch(`/api/ops/providers/${params.id}/services?serviceId=${serviceId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            })
            const data = await res.json()
            if (data.success) {
                toast.success(data.message || 'Service removed successfully')
                setProvider({
                    ...provider,
                    services: provider.services.filter((s: any) => s.serviceId !== serviceId)
                })
            } else {
                toast.error(data.error || 'Failed to remove service')
            }
        } catch (error) {
            toast.error("Failed to remove service")
        } finally {
            setIsRemoving(null)
        }
    }

    const resetModal = () => {
        setIsAddServiceOpen(false)
        setAssignmentStep('categories')
        setSelectedCategory(null)
        setSelectedSubCategory(null)
        setSelectedService(null)
        setCustomPrice('')
        setServiceNotes('')
        setSearchQuery('')
    }

    const goBack = () => {
        if (assignmentStep === 'assign') {
            setAssignmentStep('services')
            setSelectedService(null)
            setCustomPrice('')
            setServiceNotes('')
        } else if (assignmentStep === 'services') {
            setAssignmentStep('subcategories')
            setSelectedSubCategory(null)
        } else if (assignmentStep === 'subcategories') {
            setAssignmentStep('categories')
            setSelectedCategory(null)
        }
    }

    const assignedServiceIds = provider?.services?.map((s: any) => s.serviceId) || []

    const getStepNumber = () => {
        switch (assignmentStep) {
            case 'categories': return 1
            case 'subcategories': return 2
            case 'services': return 3
            case 'assign': return 4
        }
    }

    const getStepTitle = () => {
        switch (assignmentStep) {
            case 'categories': return 'Select Category'
            case 'subcategories': return 'Select Sub-Category'
            case 'services': return 'Select Service'
            case 'assign': return 'Assign Service'
        }
    }

    if (loading) return <div className="p-6 space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64" /></div>
    if (!provider) return null

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push('/ops/providers')}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <User className="h-6 w-6 text-primary" />
                            {provider.user?.name || "Unnamed Provider"}
                        </h1>
                        <p className="text-muted-foreground flex items-center gap-2 mt-1">
                            <Phone className="h-3 w-3" /> {provider.user?.phone || 'N/A'}
                            {provider.user?.email && <><Mail className="h-3 w-3 ml-2" /> {provider.user.email}</>}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Badge variant={provider.status === 'APPROVED' ? 'default' : provider.status === 'REJECTED' ? 'destructive' : 'secondary'} className="text-sm px-3 py-1">
                        {provider.status}
                    </Badge>
                    {provider.status === 'PENDING' && (
                        <>
                            <Button size="sm" onClick={() => handleAction('APPROVE')} className="bg-green-600 hover:bg-green-700">
                                <CheckCircle className="h-4 w-4 mr-1" /> Approve
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleAction('REJECT')}>
                                <XCircle className="h-4 w-4 mr-1" /> Reject
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Jobs</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold flex items-center gap-2"><Briefcase className="h-5 w-5 text-blue-600" />{provider.completedJobs || provider.totalJobs || 0}</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Avg Rating</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold flex items-center gap-2"><Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />{provider.avgRating?.toFixed(1) || '0.0'}</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Wallet Balance</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold flex items-center gap-2"><Wallet className="h-5 w-5 text-green-600" />₹{provider.walletBalance || 0}</div></CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="documents" className="w-full">
                <TabsList>
                    <TabsTrigger value="documents">Documents</TabsTrigger>
                    <TabsTrigger value="services">Services ({provider.services?.length || 0})</TabsTrigger>
                    <TabsTrigger value="earnings">Recent Earnings</TabsTrigger>
                </TabsList>

                <TabsContent value="documents" className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                        <Card>
                            <CardHeader><CardTitle className="flex items-center gap-2 text-base"><FileText className="h-4 w-4" /> Aadhar Card</CardTitle></CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-2">Number: {provider.aadharNumber || 'N/A'}</p>
                                {provider.aadharImage ? (
                                    <img src={provider.aadharImage} alt="Aadhar" className="w-full h-48 object-cover rounded-md border" />
                                ) : <p className="text-sm text-destructive">Not uploaded</p>}
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader><CardTitle className="flex items-center gap-2 text-base"><FileText className="h-4 w-4" /> PAN Card</CardTitle></CardHeader>
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
                            <CardTitle className="text-base">Assigned Services</CardTitle>
                            <Button size="sm" onClick={() => setIsAddServiceOpen(true)}>
                                <Plus className="h-4 w-4 mr-1" /> Add Service
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {provider.services && provider.services.length > 0 ? (
                                <div className="grid md:grid-cols-3 gap-4">
                                    {provider.services.map((ps: any) => (
                                        <div key={ps.id || ps.serviceId} className="flex items-start gap-3 p-4 border rounded-lg relative group">
                                            {ps.image && (
                                                <img src={ps.image} alt={ps.name} className="w-12 h-12 rounded object-cover flex-shrink-0" />
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-sm truncate">{ps.name}</p>
                                                <p className="text-xs text-muted-foreground">{ps.category}</p>
                                                {ps.customPrice && (
                                                    <p className="text-xs text-primary font-medium mt-1">₹{ps.customPrice}</p>
                                                )}
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                onClick={() => handleRemoveService(ps.serviceId)}
                                                disabled={isRemoving === ps.serviceId}
                                            >
                                                {isRemoving === ps.serviceId ? (
                                                    <Loader2 className="h-3 w-3 animate-spin" />
                                                ) : (
                                                    <Trash2 className="h-3 w-3" />
                                                )}
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <p className="text-muted-foreground mb-4">No services assigned yet.</p>
                                    <Button onClick={() => setIsAddServiceOpen(true)}>
                                        <Plus className="h-4 w-4 mr-1" /> Add First Service
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="earnings">
                    <Card>
                        <CardHeader><CardTitle className="text-base">Recent Earnings</CardTitle></CardHeader>
                        <CardContent>
                            {provider.earnings && provider.earnings.length > 0 ? (
                                <div className="space-y-2">
                                    {provider.earnings.map((e: any) => (
                                        <div key={e.id} className="flex justify-between p-3 border rounded-md">
                                            <div>
                                                <p className="font-medium">Gross: ₹{e.gross} | Net: ₹{e.net}</p>
                                                <p className="text-xs text-muted-foreground">Commission: ₹{e.commission}</p>
                                            </div>
                                            <Badge variant={e.status === 'PAID' || e.status === 'SETTLED' ? 'default' : 'secondary'}>{e.status}</Badge>
                                        </div>
                                    ))}
                                </div>
                            ) : <p className="text-muted-foreground text-center py-8">No earnings yet.</p>}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* ADD SERVICE MODAL - IMPROVED WIDTH & LAYOUT */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <Dialog open={isAddServiceOpen} onOpenChange={(open) => {
                if (!open) resetModal()
                else setIsAddServiceOpen(true)
            }}>
                <DialogContent className="sm:max-w-[95vw] md:max-w-[1100px] lg:max-w-[1200px] max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0">
                    {/* Header Section */}
                    <div className="p-6 border-b bg-gradient-to-r from-primary/5 to-primary/10">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-4">
                                {assignmentStep !== 'categories' && (
                                    <Button variant="ghost" size="icon" className="h-10 w-10" onClick={goBack}>
                                        <ChevronLeft className="h-5 w-5" />
                                    </Button>
                                )}
                                <div>
                                    <DialogTitle className="text-2xl font-bold">Assign Service</DialogTitle>
                                    <DialogDescription className="text-base mt-1">
                                        Step {getStepNumber()} of 4: {getStepTitle()}
                                    </DialogDescription>
                                </div>
                            </div>
                            {/* Step Progress Indicator */}
                            <div className="flex items-center gap-2">
                                {[1, 2, 3, 4].map((step) => (
                                    <div key={step} className="flex items-center">
                                        <div
                                            className={`h-10 w-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                                                step === getStepNumber()
                                                    ? 'bg-primary text-primary-foreground shadow-lg scale-110'
                                                    : step < getStepNumber()
                                                    ? 'bg-primary/20 text-primary'
                                                    : 'bg-muted text-muted-foreground'
                                            }`}
                                        >
                                            {step < getStepNumber() ? <CheckCircle className="h-5 w-5" /> : step}
                                        </div>
                                        {step < 4 && (
                                            <div className={`h-1 w-8 mx-1 rounded-full transition-colors ${
                                                step < getStepNumber() ? 'bg-primary' : 'bg-muted'
                                            }`} />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Breadcrumb Navigation */}
                        <div className="flex items-center gap-2 text-sm bg-background/50 rounded-lg px-4 py-3">
                            <span className={`font-medium ${selectedCategory ? 'text-primary' : 'text-foreground'}`}>
                                Category
                            </span>
                            {selectedCategory && (
                                <>
                                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                    <span className={`font-medium ${selectedSubCategory ? 'text-primary' : 'text-foreground'}`}>
                                        {selectedCategory.name}
                                    </span>
                                </>
                            )}
                            {selectedSubCategory && (
                                <>
                                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                    <span className={`font-medium ${selectedService ? 'text-primary' : 'text-foreground'}`}>
                                        {selectedSubCategory.name}
                                    </span>
                                </>
                            )}
                            {selectedService && (
                                <>
                                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-medium text-primary">{selectedService.name}</span>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Scrollable Content Area */}
                    <div className="flex-1 overflow-y-auto p-6">
                        {/* ─── STEP 1: Categories ─── */}
                        {assignmentStep === 'categories' && (
                            <div className="space-y-6">
                                {/* Search Bar */}
                                <div className="relative max-w-2xl">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                    <Input
                                        placeholder="Search categories..."
                                        className="pl-12 h-12 text-base"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>

                                {isLoadingCategories ? (
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                        {[...Array(8)].map((_, i) => (
                                            <Skeleton key={i} className="h-28 w-full" />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                        {categories.map((cat: any) => (
                                            <button
                                                key={cat.id}
                                                onClick={() => {
                                                    setSelectedCategory(cat)
                                                    setAssignmentStep('subcategories')
                                                }}
                                                className="flex flex-col items-center gap-3 p-6 border-2 rounded-xl hover:border-primary hover:bg-primary/5 transition-all text-center group hover:shadow-lg"
                                            >
                                                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                                    <span className="text-3xl font-bold text-primary">{cat.name.charAt(0)}</span>
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-semibold text-base mb-1">{cat.name}</p>
                                                    <p className="text-sm text-muted-foreground">{cat.subCategories.length} sub-categories</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {!isLoadingCategories && categories.length === 0 && (
                                    <div className="text-center py-12">
                                        <p className="text-muted-foreground text-lg">No categories found.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ─── STEP 2: Sub-Categories ─── */}
                        {assignmentStep === 'subcategories' && selectedCategory && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {selectedCategory.subCategories.map((sub: any) => (
                                        <button
                                            key={sub.id}
                                            onClick={() => {
                                                setSelectedSubCategory(sub)
                                                setAssignmentStep('services')
                                            }}
                                            className="flex items-center gap-4 p-5 border-2 rounded-xl hover:border-primary hover:bg-primary/5 transition-all text-left group hover:shadow-lg"
                                        >
                                            <div className="flex-1">
                                                <p className="font-semibold text-base mb-1">{sub.name}</p>
                                                <p className="text-sm text-muted-foreground">{sub.services.length} services available</p>
                                            </div>
                                            <ChevronRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </button>
                                    ))}
                                </div>

                                {selectedCategory.subCategories.length === 0 && (
                                    <div className="text-center py-12">
                                        <p className="text-muted-foreground text-lg">No sub-categories found.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ─── STEP 3: Services ─── */}
                        {assignmentStep === 'services' && selectedSubCategory && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                    {selectedSubCategory.services.map((svc: any) => {
                                        const isAssigned = assignedServiceIds.includes(svc.id)
                                        return (
                                            <button
                                                key={svc.id}
                                                onClick={() => {
                                                    if (!isAssigned) {
                                                        setSelectedService(svc)
                                                        setAssignmentStep('assign')
                                                    }
                                                }}
                                                disabled={isAssigned}
                                                className={`flex gap-4 p-5 border-2 rounded-xl transition-all text-left group hover:shadow-lg ${
                                                    isAssigned
                                                        ? 'opacity-50 cursor-not-allowed bg-muted border-muted'
                                                        : 'hover:border-primary hover:bg-primary/5'
                                                }`}
                                            >
                                                {svc.image && (
                                                    <img 
                                                        src={svc.image} 
                                                        alt={svc.name} 
                                                        className="w-24 h-24 rounded-lg object-cover flex-shrink-0 shadow-md" 
                                                    />
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-base mb-2 line-clamp-2">{svc.name}</p>
                                                    <div className="space-y-1">
                                                        <p className="text-sm text-muted-foreground">
                                                            <span className="font-medium text-foreground">₹{svc.basePrice}</span>
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {svc.priceType.replace('_', ' ')}
                                                        </p>
                                                    </div>
                                                </div>
                                                {isAssigned ? (
                                                    <Badge variant="secondary" className="text-xs flex-shrink-0 h-fit">
                                                        Already Assigned
                                                    </Badge>
                                                ) : (
                                                    <ChevronRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                                                )}
                                            </button>
                                        )
                                    })}
                                </div>

                                {selectedSubCategory.services.length === 0 && (
                                    <div className="text-center py-12">
                                        <p className="text-muted-foreground text-lg">No services found in this sub-category.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ─── STEP 4: Assign Service ─── */}
                        {assignmentStep === 'assign' && selectedService && (
                            <div className="space-y-6 max-w-2xl mx-auto">
                                {/* Service Preview Card - Large & Prominent */}
                                <div className="flex gap-6 p-6 border-2 rounded-xl bg-gradient-to-r from-primary/5 to-primary/10">
                                    {selectedService.image && (
                                        <img 
                                            src={selectedService.image} 
                                            alt={selectedService.name} 
                                            className="w-32 h-32 rounded-xl object-cover flex-shrink-0 shadow-lg" 
                                        />
                                    )}
                                    <div className="flex-1">
                                        <p className="font-bold text-xl mb-3">{selectedService.name}</p>
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-muted-foreground">Base Price:</span>
                                                <span className="text-lg font-bold text-primary">₹{selectedService.basePrice}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-muted-foreground">Type:</span>
                                                <Badge variant="outline">{selectedService.priceType.replace('_', ' ')}</Badge>
                                            </div>
                                        </div>
                                    </div>
                                    <CheckCircle className="h-8 w-8 text-green-500 flex-shrink-0" />
                                </div>

                                {/* Custom Price Input */}
                                <div className="space-y-3">
                                    <Label htmlFor="customPrice" className="text-base font-semibold">
                                        Custom Price (Optional)
                                    </Label>
                                    <Input
                                        id="customPrice"
                                        type="number"
                                        placeholder={`Leave empty to use base price (₹${selectedService.basePrice})`}
                                        value={customPrice}
                                        onChange={(e) => setCustomPrice(e.target.value)}
                                        className="h-12 text-base"
                                    />
                                    <p className="text-sm text-muted-foreground">
                                        Override the base price specifically for this provider
                                    </p>
                                </div>

                                {/* Notes Input */}
                                <div className="space-y-3">
                                    <Label htmlFor="serviceNotes" className="text-base font-semibold">
                                        Notes (Optional)
                                    </Label>
                                    <Input
                                        id="serviceNotes"
                                        placeholder="Any notes for this assignment..."
                                        value={serviceNotes}
                                        onChange={(e) => setServiceNotes(e.target.value)}
                                        className="h-12 text-base"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer Section */}
                    <div className="p-6 border-t bg-muted/30 flex items-center justify-between">
                        <Button variant="outline" size="lg" onClick={resetModal}>
                            Cancel
                        </Button>

                        {assignmentStep === 'assign' ? (
                            <Button size="lg" onClick={handleAssignService} disabled={isAssigning} className="min-w-[180px]">
                                {isAssigning ? (
                                    <>
                                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                        Assigning...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="h-5 w-5 mr-2" />
                                        Assign Service
                                    </>
                                )}
                            </Button>
                        ) : (
                            <div className="text-right">
                                <p className="text-sm text-muted-foreground">
                                    Select an option to continue
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Click on any card to proceed
                                </p>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}