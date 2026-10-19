// apps/web/src/components/provider/JobCard.tsx

"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, MapPin, User, Phone, CreditCard, Banknote, Loader2 } from "lucide-react"
import Link from "next/link"

interface JobCardProps {
    job: any
    onAction: (id: string, action: string, job?: any) => void
    actionLoading?: boolean
}

export function JobCard({ job, onAction, actionLoading }: JobCardProps) {
    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            PROVIDER_ASSIGNED: 'bg-blue-100 text-blue-700 border-blue-200',
            CONFIRMED: 'bg-green-100 text-green-700 border-green-200',
            PROVIDER_TRAVELLING: 'bg-purple-100 text-purple-700 border-purple-200',
            SERVICE_STARTED: 'bg-orange-100 text-orange-700 border-orange-200',
            SERVICE_COMPLETED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
            CANCELLED_BY_CUSTOMER: 'bg-red-100 text-red-700 border-red-200',
            CANCELLED_BY_OPS: 'bg-red-100 text-red-700 border-red-200',
            CANCELLED_BY_PROVIDER: 'bg-red-100 text-red-700 border-red-200',
        }
        return colors[status] || 'bg-gray-100 text-gray-700 border-gray-200'
    }

    const isPOD = job.paymentMethod === 'POD' || job.paymentMethod === 'COD'
    const isPaymentPending = isPOD && job.paymentStatus !== 'PAID'
    const isPaymentPaid = isPOD && job.paymentStatus === 'PAID'

    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg truncate">{job.service.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">#{job.bookingNumber}</p>
                    </div>
                    <div className="flex flex-col gap-1.5 items-end flex-shrink-0">
                        <Badge className={getStatusColor(job.status)}>
                            {job.status.replace(/_/g, ' ')}
                        </Badge>

                        {/* ✅ FIX: Payment Method + Status badges — flat, no nesting */}
                        {isPOD && (
                            <Badge variant="outline" className="text-xs border-amber-500 text-amber-700">
                                💳 POD
                            </Badge>
                        )}
                        {job.paymentMethod === 'ONLINE' && (
                            <Badge variant="outline" className="text-xs border-green-500 text-green-700">
                                💳 Online
                            </Badge>
                        )}

                        {isPOD && isPaymentPending && (
                            <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800">
                                ⏳ {job.razorpayPaymentLinkUrl ? 'Link Sent' : 'Link Pending'}
                            </Badge>
                        )}
                        {isPaymentPaid && (
                            <Badge className="text-xs bg-green-100 text-green-800 border border-green-200">
                                ✓ Paid
                            </Badge>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate">{job.user.name}</span>
                    <a href={`tel:${job.user.phone}`} className="ml-auto text-primary hover:underline">
                        <Phone className="h-4 w-4" />
                    </a>
                </div>
                <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{new Date(job.scheduledDate).toLocaleDateString('en-IN')}</span>
                    <Clock className="h-4 w-4 text-muted-foreground ml-2" />
                    <span>{job.scheduledTime}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate">{job.address.area}</span>
                </div>
                <div className="pt-3 border-t flex items-center justify-between gap-2">
                    <span className="text-lg font-bold">₹{job.totalAmount}</span>
                    <div className="flex gap-2 flex-wrap justify-end">
                        {job.status === 'PROVIDER_ASSIGNED' && (
                            <>
                                <Button size="sm" onClick={() => onAction(job.id, 'accept', job)} disabled={actionLoading}>
                                    Accept
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => onAction(job.id, 'reject', job)} disabled={actionLoading}>
                                    Reject
                                </Button>
                            </>
                        )}
                        {job.status === 'CONFIRMED' && (
                            <>
                                <Button size="sm" variant="outline" onClick={() => onAction(job.id, 'on_the_way', job)} disabled={actionLoading}>
                                    On Way
                                </Button>
                                <Button size="sm" onClick={() => onAction(job.id, 'start', job)} disabled={actionLoading}>
                                    Start
                                </Button>
                            </>
                        )}
                        {job.status === 'PROVIDER_TRAVELLING' && (
                            <Button size="sm" onClick={() => onAction(job.id, 'start', job)} disabled={actionLoading}>
                                Start Service
                            </Button>
                        )}
                        {job.status === 'SERVICE_STARTED' && (
                            <Button 
                                size="sm" 
                                onClick={() => onAction(job.id, 'complete', job)} 
                                disabled={actionLoading || isPaymentPending}
                                title={isPaymentPending ? 'Wait for customer payment via Razorpay link' : ''}
                            >
                                {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Complete'}
                            </Button>
                        )}
                        <Button size="sm" variant="outline" asChild>
                            <Link href={`/provider/jobs/${job.id}`}>View</Link>
                        </Button>
                    </div>
                </div>

                {/* ✅ NEW: Warning message when POD payment is pending */}
                {job.status === 'SERVICE_STARTED' && isPaymentPending && (
                    <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded p-2">
                        ⚠️ Complete karne ke liye customer se payment link ke through payment karwayein.
                    </p>
                )}
            </CardContent>
        </Card>
    )
}