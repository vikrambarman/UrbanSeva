/**
 * WHAT: Job card with payment method indicator
 * WHY: Provider needs to know if it's ONLINE or COD
 */

"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, MapPin, User, Phone, CreditCard, Banknote } from "lucide-react"
import Link from "next/link"

interface JobCardProps {
    job: any
    onAction: (id: string, action: string, job?: any) => void
}

export function JobCard({ job, onAction }: JobCardProps) {
    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            PROVIDER_ASSIGNED: 'bg-blue-100 text-blue-700 border-blue-200',
            CONFIRMED: 'bg-green-100 text-green-700 border-green-200',
            PROVIDER_TRAVELLING: 'bg-purple-100 text-purple-700 border-purple-200',
            SERVICE_STARTED: 'bg-orange-100 text-orange-700 border-orange-200',
            SERVICE_COMPLETED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
            CANCELLED: 'bg-red-100 text-red-700 border-red-200',
            CANCELLED_BY_PROVIDER: 'bg-red-100 text-red-700 border-red-200',
        }
        return colors[status] || 'bg-gray-100 text-gray-700 border-gray-200'
    }

    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div>
                        <CardTitle className="text-lg">{job.service.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">#{job.bookingNumber}</p>
                    </div>
                    <div className="flex flex-col gap-2">
                        <Badge className={getStatusColor(job.status)}>
                            {job.status.replace(/_/g, ' ')}
                        </Badge>
                        {/* Payment Method Badge */}
                        <Badge 
                            variant="outline" 
                            className={job.paymentMethod === 'COD' 
                                ? 'border-orange-300 text-orange-700' 
                                : 'border-green-300 text-green-700'
                            }
                        >
                            {job.paymentMethod === 'COD' ? (
                                <><Banknote className="h-3 w-3 mr-1" /> COD</>
                            ) : (
                                <><CreditCard className="h-3 w-3 mr-1" /> Online</>
                            )}
                        </Badge>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{job.user.name}</span>
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
                <div className="pt-3 border-t flex items-center justify-between">
                    <span className="text-lg font-bold">₹{job.totalAmount}</span>
                    <div className="flex gap-2">
                        {job.status === 'PROVIDER_ASSIGNED' && (
                            <>
                                <Button size="sm" onClick={() => onAction(job.id, 'accept', job)}>Accept</Button>
                                <Button size="sm" variant="destructive" onClick={() => onAction(job.id, 'reject', job)}>Reject</Button>
                            </>
                        )}
                        {job.status === 'CONFIRMED' && (
                            <>
                                <Button size="sm" onClick={() => onAction(job.id, 'on_the_way', job)}>On Way</Button>
                                <Button size="sm" onClick={() => onAction(job.id, 'start', job)}>Start</Button>
                            </>
                        )}
                        {job.status === 'PROVIDER_TRAVELLING' && (
                            <Button size="sm" onClick={() => onAction(job.id, 'start', job)}>Start Service</Button>
                        )}
                        {job.status === 'SERVICE_STARTED' && (
                            <Button size="sm" onClick={() => onAction(job.id, 'complete', job)}>Complete</Button>
                        )}
                        <Button size="sm" variant="outline" asChild>
                            <Link href={`/provider/jobs/${job.id}`}>View</Link>
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}