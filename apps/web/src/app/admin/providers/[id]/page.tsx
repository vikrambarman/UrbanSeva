"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { ArrowLeft, CheckCircle, XCircle, FileText, Star, Wallet, Briefcase } from "lucide-react"
import { toast } from "sonner"
import { apiFetch } from "@/lib/api-client"

export default function AdminProviderDetailPage() {
    const params = useParams()
    const router = useRouter()
    const [provider, setProvider] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [commission, setCommission] = useState(0)

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
    }, [params.id, router])

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
                    <TabsTrigger value="services">Assigned Services</TabsTrigger>
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
                        <CardHeader><CardTitle>Assigned Services ({provider.services.length})</CardTitle></CardHeader>
                        <CardContent>
                            {provider.services.length > 0 ? (
                                <div className="grid md:grid-cols-3 gap-4">
                                    {provider.services.map((ps: any) => (
                                        <div key={ps.id} className="flex items-center gap-3 p-3 border rounded-md">
                                            {ps.service.image && <img src={ps.service.image} alt={ps.service.name} className="w-10 h-10 rounded object-cover" />}
                                            <div>
                                                <p className="font-medium text-sm">{ps.service.name}</p>
                                                <p className="text-xs text-muted-foreground">Custom Price: ₹{ps.customPrice || 'Default'}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : <p className="text-muted-foreground">No services assigned yet.</p>}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="earnings">
                    <Card>
                        <CardHeader><CardTitle>Recent Earnings</CardTitle></CardHeader>
                        <CardContent>
                            {provider.earnings.length > 0 ? (
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
                            {provider.payouts.length > 0 ? (
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
        </div>
    )
}