"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
    ArrowLeft, MapPin, User, Calendar, Clock, Phone, Star, 
    CreditCard, CheckCircle2, Loader2, Copy, ExternalLink,
    Banknote, RefreshCw
} from "lucide-react"
import { toast } from "sonner"
import { apiFetch } from "@/lib/api-client"
import { QRCodeSVG } from "qrcode.react"

export default function ProviderJobDetailPage() {
    const params = useParams()
    const router = useRouter()
    const [job, setJob] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState(false)
    const [generatingLink, setGeneratingLink] = useState(false)
    const [refreshing, setRefreshing] = useState(false)

    const fetchJob = useCallback(async (silent = false) => {
        if (!silent) setLoading(true)
        try {
            // ✅ FIX: cache: 'no-store' add kiya taaki polling mein fresh data aaye
            const res = await apiFetch(`/api/provider/jobs/${params.id}`, { cache: 'no-store' })
            const data = await res.json()
            if (data.success) setJob(data.data)
            else if (!silent) { 
                toast.error(data.error)
                router.push('/provider/jobs')
            }
        } catch (error) { 
            console.error("Job fetch error:", error)
            if (!silent) toast.error("Failed to fetch job") 
        } finally { if (!silent) setLoading(false) }
    }, [params.id, router])

    useEffect(() => { fetchJob() }, [fetchJob])

    useEffect(() => {
        if (!job) return
        const isPOD = job.paymentMethod === 'POD' || job.paymentMethod === 'COD'
        const isPending = isPOD && job.paymentStatus !== 'PAID' && job.razorpayPaymentLinkUrl

        if (!isPending) return

        const interval = setInterval(() => {
            fetchJob(true)
        }, 10000)

        return () => clearInterval(interval)
    }, [job, fetchJob])

    const handleAction = async (action: string, extraData?: any) => {
        setActionLoading(true)
        try {
            const res = await apiFetch(`/api/provider/jobs/${params.id}/status`, {
                method: 'POST',
                body: JSON.stringify({ action, ...extraData })
            })
            const data = await res.json()
            
            if (data.success) {
                toast.success(data.message || `Job ${action}ed!`)
                fetchJob()
            } else toast.error(data.error)
        } catch (error) { 
            console.error("Job action error:", error)
            toast.error("Action failed") 
        } finally {
            setActionLoading(false)
        }
    }

    const handleGeneratePaymentLink = async () => {
        setGeneratingLink(true)
        try {
            const res = await apiFetch(`/api/bookings/${params.id}/payment-link`, { method: 'POST' })
            const data = await res.json()
            if (data.success) {
                toast.success('Payment link generated & sent to customer!')
                fetchJob()
            } else {
                toast.error(data.error || 'Failed to generate payment link')
            }
        } catch (error) {
            console.error("Payment link error:", error)
            toast.error("Failed to generate payment link")
        } finally {
            setGeneratingLink(false)
        }
    }

    const handleManualRefresh = async () => {
        setRefreshing(true)
        await fetchJob(true)
        setRefreshing(false)
        toast.success('Status refreshed')
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        toast.success('Link copied to clipboard!')
    }

    if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
    if (!job) return null

    const isPOD = job.paymentMethod === 'POD' || job.paymentMethod === 'COD'
    const isPaymentPending = isPOD && job.paymentStatus !== 'PAID'
    const canShowPaymentCard = isPOD && (job.status === 'SERVICE_STARTED' || job.status === 'SERVICE_COMPLETED')

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
                <div className="flex flex-col items-end gap-2">
                    <Badge className="text-sm px-3 py-1">{job.status.replace(/_/g, ' ')}</Badge>
                    {isPOD && (
                        <Badge variant={job.paymentStatus === 'PAID' ? 'default' : 'secondary'} className="text-xs">
                            {job.paymentStatus === 'PAID' ? '✓ Payment Received' : '⏳ Awaiting Payment'}
                        </Badge>
                    )}
                </div>
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
                            {isPOD && (
                                <p className="text-xs text-muted-foreground mt-1">
                                    {job.paymentMethod === 'POD' ? 'Payment on Delivery' : 'Cash on Delivery'}
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {canShowPaymentCard && isPaymentPending && (
                <Card className="border-amber-200 bg-amber-50">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2 text-amber-800">
                                <Banknote className="h-5 w-5" />
                                Payment Pending
                            </CardTitle>
                            <Button size="sm" variant="ghost" onClick={handleManualRefresh} disabled={refreshing}>
                                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-amber-700">
                            Ask customer to pay ₹{job.totalAmount} using the link or QR code below. 
                            Status will auto-update once payment is received — koi manual confirmation ki zaroorat nahi.
                        </p>

                        {job.razorpayPaymentLinkUrl ? (
                            <div className="space-y-4">
                                {/* QR Code - UNTOUCHED */}
                                <div className="flex flex-col items-center gap-2 p-4 bg-white rounded-lg border">
                                    <QRCodeSVG value={job.razorpayPaymentLinkUrl} size={180} />
                                    <p className="text-xs text-muted-foreground">Scan to pay via any UPI app</p>
                                </div>

                                <div className="flex items-center gap-2 p-3 bg-white rounded-lg border">
                                    <CreditCard className="h-4 w-4 text-primary flex-shrink-0" />
                                    <span className="text-sm font-mono truncate flex-1">{job.razorpayPaymentLinkUrl}</span>
                                    <Button size="sm" variant="outline" onClick={() => copyToClipboard(job.razorpayPaymentLinkUrl)}>
                                        <Copy className="h-3 w-3" />
                                    </Button>
                                </div>

                                <a href={job.razorpayPaymentLinkUrl} target="_blank" rel="noopener noreferrer">
                                    <Button variant="outline" className="w-full">
                                        <ExternalLink className="h-4 w-4 mr-2" /> Open Payment Link
                                    </Button>
                                </a>

                                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground animate-pulse">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Waiting for customer to complete payment...
                                </div>
                            </div>
                        ) : (
                            <Button onClick={handleGeneratePaymentLink} disabled={generatingLink} className="w-full">
                                {generatingLink ? (
                                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating Link...</>
                                ) : (
                                    <><CreditCard className="h-4 w-4 mr-2" /> Generate Payment Link</>
                                )}
                            </Button>
                        )}
                    </CardContent>
                </Card>
            )}

            {isPOD && job.paymentStatus === 'PAID' && (
                <Card className="border-green-200 bg-green-50">
                    <CardContent className="flex items-center gap-3 p-4">
                        <CheckCircle2 className="h-6 w-6 text-green-600" />
                        <div>
                            <p className="font-medium text-green-800">Payment Received ✓</p>
                            <p className="text-sm text-green-600">₹{job.totalAmount} confirmed via Razorpay</p>
                        </div>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader><CardTitle>Actions</CardTitle></CardHeader>
                <CardContent className="flex flex-wrap gap-3">
                    {job.status === 'PROVIDER_ASSIGNED' && (
                        <>
                            <Button onClick={() => handleAction('accept')} disabled={actionLoading}>Accept Job</Button>
                            <Button variant="destructive" onClick={() => handleAction('reject')} disabled={actionLoading}>Reject Job</Button>
                        </>
                    )}
                    {job.status === 'CONFIRMED' && (
                        <Button onClick={() => handleAction('start')} disabled={actionLoading}>
                            {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Start Service
                        </Button>
                    )}
                    {job.status === 'SERVICE_STARTED' && (
                        <Button 
                            onClick={() => handleAction('complete')} 
                            disabled={actionLoading || (isPOD && isPaymentPending)}
                        >
                            {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} 
                            Complete Service
                        </Button>
                    )}
                    {job.status === 'SERVICE_STARTED' && isPOD && isPaymentPending && (
                        <p className="text-xs text-amber-600 w-full">
                            ⚠️ Complete button disabled until customer payment is confirmed.
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}