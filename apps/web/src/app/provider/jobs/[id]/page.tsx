/**
 * WHAT: Provider job detail page with POD payment collection
 * WHY: 
 * - Provider "Collect Payment" button dabayega POD ke liye
 * - Payment link generate hoga
 * - Provider customer ko payment karega
 * - Payment confirm hone pe status update hoga
 */

"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
    ArrowLeft, MapPin, User, Calendar, Clock, Phone, Star, 
    CreditCard, CheckCircle2, Loader2, Copy, ExternalLink,
    Banknote, AlertCircle
} from "lucide-react"
import { toast } from "sonner"
import { apiFetch } from "@/lib/api-client"

export default function ProviderJobDetailPage() {
    const params = useParams()
    const router = useRouter()
    const [job, setJob] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState(false)

    // POD Payment states
    const [paymentLinkModal, setPaymentLinkModal] = useState(false)
    const [paymentLink, setPaymentLink] = useState('')
    const [paymentLinkId, setPaymentLinkId] = useState('')
    const [generatingLink, setGeneratingLink] = useState(false)
    const [confirmingPayment, setConfirmingPayment] = useState(false)
    const [razorpayPaymentId, setRazorpayPaymentId] = useState('')

    useEffect(() => {
        const fetchJob = async () => {
            try {
                const res = await apiFetch(`/api/provider/jobs/${params.id}`)
                const data = await res.json()
                
                if (data.success) setJob(data.data)
                else { 
                    toast.error(data.error)
                    router.push('/provider/jobs')
                }
            } catch (error) { 
                console.error("Job fetch error:", error)
                toast.error("Failed to fetch job") 
            } finally { setLoading(false) }
        }
        fetchJob()
    }, [params.id, router])

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
                setJob({ ...job, status: data.data.status })
            } else toast.error(data.error)
        } catch (error) { 
            console.error("Job action error:", error)
            toast.error("Action failed") 
        } finally {
            setActionLoading(false)
        }
    }

    // ═══════════════════════════════
    // POD: Generate Payment Link
    // ═══════════════════════════════
    const handleGeneratePaymentLink = async () => {
        setGeneratingLink(true)
        try {
            const res = await apiFetch(`/api/bookings/${params.id}/payment-link`, {
                method: 'POST'
            })
            const data = await res.json()
            
            if (data.success) {
                setPaymentLink(data.data.paymentLink)
                setPaymentLinkId(data.data.paymentLinkId)
                setPaymentLinkModal(true)
                toast.success('Payment link generated!')
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

    // ═══════════════════════════════
    // POD: Confirm Payment Received
    // ═══════════════════════════════
    const handleConfirmPayment = async () => {
        setConfirmingPayment(true)
        try {
            const res = await apiFetch(`/api/bookings/${params.id}/payment-link/verify`, {
                method: 'POST',
                body: JSON.stringify({
                    razorpayPaymentId: razorpayPaymentId || undefined
                })
            })
            const data = await res.json()
            
            if (data.success) {
                toast.success('Payment confirmed!')
                setPaymentLinkModal(false)
                // Refresh job data
                const jobRes = await apiFetch(`/api/provider/jobs/${params.id}`)
                const jobData = await jobRes.json()
                if (jobData.success) setJob(jobData.data)
            } else {
                toast.error(data.error || 'Failed to confirm payment')
            }
        } catch (error) {
            console.error("Payment confirm error:", error)
            toast.error("Failed to confirm payment")
        } finally {
            setConfirmingPayment(false)
        }
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        toast.success('Link copied to clipboard!')
    }

    if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
    if (!job) return null

    const isPOD = job.paymentMethod === 'POD' || job.paymentMethod === 'COD'
    const isPaymentPending = isPOD && job.paymentStatus !== 'PAID'
    const isServiceCompleted = job.status === 'SERVICE_COMPLETED'

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
                    <Badge variant={job.status === 'CANCELLED' ? 'destructive' : 'default'} className="text-sm px-3 py-1">
                        {job.status.replace(/_/g, ' ')}
                    </Badge>
                    {isPOD && (
                        <Badge variant={job.paymentStatus === 'PAID' ? 'default' : 'secondary'} className="text-xs">
                            {job.paymentStatus === 'PAID' ? '✓ Paid' : '⏳ Payment Pending'}
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

            {/* ═══════════════════════════════ */}
            {/* POD PAYMENT COLLECTION CARD */}
            {/* ═══════════════════════════════ */}
            {isPOD && isServiceCompleted && isPaymentPending && (
                <Card className="border-amber-200 bg-amber-50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-amber-800">
                            <Banknote className="h-5 w-5" />
                            Collect Payment
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-amber-700">
                            Service completed! Collect ₹{job.totalAmount} from customer via online payment link.
                        </p>
                        
                        {job.razorpayPaymentLinkUrl ? (
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 p-3 bg-white rounded-lg border">
                                    <CreditCard className="h-4 w-4 text-primary" />
                                    <span className="text-sm font-mono truncate flex-1">{job.razorpayPaymentLinkUrl}</span>
                                    <Button 
                                        size="sm" 
                                        variant="outline"
                                        onClick={() => copyToClipboard(job.razorpayPaymentLinkUrl)}
                                    >
                                        <Copy className="h-3 w-3" />
                                    </Button>
                                </div>
                                <div className="flex gap-2">
                                    <a 
                                        href={job.razorpayPaymentLinkUrl} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="flex-1"
                                    >
                                        <Button variant="outline" className="w-full">
                                            <ExternalLink className="h-4 w-4 mr-2" />
                                            Open Payment Link
                                        </Button>
                                    </a>
                                    <Button onClick={() => {
                                        setPaymentLink(job.razorpayPaymentLinkUrl)
                                        setPaymentLinkId(job.razorpayPaymentLinkId)
                                        setPaymentLinkModal(true)
                                    }}>
                                        <CheckCircle2 className="h-4 w-4 mr-2" />
                                        Confirm Payment
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <Button 
                                onClick={handleGeneratePaymentLink}
                                disabled={generatingLink}
                                className="w-full"
                            >
                                {generatingLink ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Generating Link...
                                    </>
                                ) : (
                                    <>
                                        <CreditCard className="h-4 w-4 mr-2" />
                                        Generate Payment Link
                                    </>
                                )}
                            </Button>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* POD Payment Already Done */}
            {isPOD && job.paymentStatus === 'PAID' && (
                <Card className="border-green-200 bg-green-50">
                    <CardContent className="flex items-center gap-3 p-4">
                        <CheckCircle2 className="h-6 w-6 text-green-600" />
                        <div>
                            <p className="font-medium text-green-800">Payment Received</p>
                            <p className="text-sm text-green-600">₹{job.totalAmount} collected successfully</p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Action Buttons */}
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
                            {actionLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                            Start Service
                        </Button>
                    )}
                    {job.status === 'SERVICE_STARTED' && (
                        <Button onClick={() => handleAction('complete')} disabled={actionLoading}>
                            {actionLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                            Complete Service
                        </Button>
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
                                        {h.note && <p className="text-xs text-muted-foreground mt-1">{h.note}</p>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* ═══════════════════════════════ */}
            {/* PAYMENT CONFIRMATION MODAL */}
            {/* ═══════════════════════════════ */}
            <Dialog open={paymentLinkModal} onOpenChange={setPaymentLinkModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <CreditCard className="h-5 w-5 text-primary" />
                            Confirm Payment Received
                        </DialogTitle>
                        <DialogDescription>
                            Customer ne payment complete kar di hai? Confirm karein.
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4 py-4">
                        {/* Payment Link Display */}
                        <div className="p-3 bg-muted rounded-lg">
                            <p className="text-xs text-muted-foreground mb-1">Payment Link:</p>
                            <p className="text-sm font-mono truncate">{paymentLink}</p>
                        </div>

                        {/* Amount */}
                        <div className="flex justify-between items-center p-3 bg-primary/5 rounded-lg">
                            <span className="font-medium">Amount:</span>
                            <span className="text-xl font-bold text-primary">₹{job?.totalAmount}</span>
                        </div>

                        {/* Razorpay Payment ID (optional) */}
                        <div className="space-y-2">
                            <Label>Razorpay Payment ID (Optional)</Label>
                            <Input
                                placeholder="pay_XXXXXXXXXXXXXX"
                                value={razorpayPaymentId}
                                onChange={(e) => setRazorpayPaymentId(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">
                                Agar customer ne payment ID di hai toh enter karein
                            </p>
                        </div>

                        {/* Warning */}
                        <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                            <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-amber-700">
                                Confirm karne se pehle ensure karein ki customer ne payment complete kar di hai.
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <Button 
                            variant="outline" 
                            onClick={() => setPaymentLinkModal(false)}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button 
                            onClick={handleConfirmPayment}
                            disabled={confirmingPayment}
                            className="flex-1"
                        >
                            {confirmingPayment ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Confirming...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                    Confirm Payment
                                </>
                            )}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}