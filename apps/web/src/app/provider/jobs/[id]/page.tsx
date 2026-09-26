"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, MapPin, User, Calendar, Clock, Phone, Star } from "lucide-react"
import { toast } from "sonner"
import { apiFetch } from "@/lib/api-client"

export default function ProviderJobDetailPage() {
    const params = useParams()
    const router = useRouter()
    const [job, setJob] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
    const fetchJob = async () => {
        try {
            // ✅ FIX: Response object milega
            const res = await apiFetch(`/api/provider/jobs/${params.id}`)
            // ✅ FIX: Parse karo
            const data = await res.json()
            
            if (data.success) setJob(data.data)
            else { 
                toast.error(data.error)
                router.push('/provider/jobs')
            }
        } catch (error) { 
            console.error("Job fetch error:", error)
            toast.error("Failed to fetch job") 
        }
        finally { setLoading(false) }
    }
    fetchJob()
}, [params.id, router])

const handleAction = async (action: string) => {
    try {
        // ✅ FIX: Response object milega
        const res = await apiFetch(`/api/provider/jobs/${params.id}/status`, {
            method: 'POST',
            body: JSON.stringify({ action })
        })
        // ✅ FIX: Parse karo
        const data = await res.json()
        
        if (data.success) {
            toast.success(`Job ${action}ed!`)
            setJob({ ...job, status: data.data.status })
        } else toast.error(data.error)
    } catch (error) { 
        console.error("Job action error:", error)
        toast.error("Action failed") 
    }
}

    if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
    if (!job) return null

    return (
        <div className="p-6 space-y-6 max-w-4xl mx-auto">
            <Button variant="ghost" onClick={() => router.push('/provider/jobs')}>
                <ArrowLeft className="h-4 w-4 mr-2" /> Back to Jobs
            </Button>

            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold">{job.service.name}</h1>
                    <p className="text-muted-foreground">Booking #{job.bookingNumber}</p>
                </div>
                <Badge variant={job.status === 'CANCELLED' ? 'destructive' : 'default'} className="text-sm px-3 py-1">
                    {job.status.replace(/_/g, ' ')}
                </Badge>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader><CardTitle>Customer Details</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex items-center gap-3">
                            <User className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <p className="font-medium">{job.user.name}</p>
                                <p className="text-sm text-muted-foreground">{job.user.phone}</p>
                            </div>
                        </div>
                        <a href={`tel:${job.user.phone}`} className="flex items-center gap-3 text-primary hover:underline">
                            <Phone className="h-5 w-5" />
                            <span>Call Customer</span>
                        </a>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>Service Details</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex items-center gap-3">
                            <Calendar className="h-5 w-5 text-muted-foreground" />
                            <span>{new Date(job.scheduledDate).toLocaleDateString('en-IN')}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Clock className="h-5 w-5 text-muted-foreground" />
                            <span>{job.scheduledTime} • {job.service.duration}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <MapPin className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <p className="text-sm">{job.address.fullAddress}</p>
                                <p className="text-xs text-muted-foreground">{job.address.area}</p>
                            </div>
                        </div>
                        <div className="pt-3 border-t">
                            <p className="text-2xl font-bold">₹{job.totalAmount}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Action Buttons */}
            <Card>
                <CardHeader><CardTitle>Actions</CardTitle></CardHeader>
                <CardContent className="flex gap-3">
                    {job.status === 'PROVIDER_ASSIGNED' && (
                        <>
                            <Button onClick={() => handleAction('accept')}>Accept Job</Button>
                            <Button variant="destructive" onClick={() => handleAction('reject')}>Reject Job</Button>
                        </>
                    )}
                    {job.status === 'CONFIRMED' && (
                        <Button onClick={() => handleAction('start')}>Start Service</Button>
                    )}
                    {job.status === 'SERVICE_STARTED' && (
                        <Button onClick={() => handleAction('complete')}>Complete Service</Button>
                    )}
                    {job.status === 'SERVICE_COMPLETED' && (
                        <div className="flex items-center gap-2">
                            <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                            <span className="font-medium">Job Completed!</span>
                            {job.review && <span className="text-muted-foreground">Rating: {job.review.overallRating}/5</span>}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Status History */}
            {job.statusHistory?.length > 0 && (
                <Card>
                    <CardHeader><CardTitle>Status History</CardTitle></CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {job.statusHistory.map((h: any) => (
                                <div key={h.id} className="flex gap-3 border-l-2 border-primary/20 pl-3 py-1">
                                    <div>
                                        <p className="font-medium text-sm">{h.status.replace(/_/g, ' ')}</p>
                                        <p className="text-xs text-muted-foreground">{new Date(h.createdAt).toLocaleString()}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}