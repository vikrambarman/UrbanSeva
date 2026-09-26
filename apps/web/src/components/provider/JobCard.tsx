"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, MapPin, User, Clock, ChevronRight, Star } from "lucide-react"
import Link from "next/link"

interface JobCardProps {
    job: any
    onAction?: (id: string, action: string) => void
}

export function JobCard({ job, onAction }: JobCardProps) {
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PENDING': return 'secondary'
            case 'CONFIRMED': return 'default'
            case 'PROVIDER_ASSIGNED': return 'outline'
            case 'SERVICE_STARTED': return 'default'
            case 'SERVICE_COMPLETED': return 'default'
            case 'CANCELLED': return 'destructive'
            default: return 'secondary'
        }
    }

    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {job.service.image && (
                            <img src={job.service.image} alt={job.service.name} className="w-12 h-12 rounded-md object-cover" />
                        )}
                        <div>
                            <h3 className="font-semibold">{job.service.name}</h3>
                            <p className="text-sm text-muted-foreground">#{job.bookingNumber}</p>
                        </div>
                    </div>
                    <Badge variant={getStatusColor(job.status) as any}>
                        {job.status.replace(/_/g, ' ')}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(job.scheduledDate).toLocaleDateString('en-IN')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{job.scheduledTime}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <User className="h-4 w-4" />
                        <span>{job.user.name || 'Customer'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span className="truncate">{job.address.area}</span>
                    </div>
                </div>

                {job.review && (
                    <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium">{job.review.overallRating}/5</span>
                        {job.review.comment && <span className="text-sm text-muted-foreground truncate">- {job.review.comment}</span>}
                    </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-lg font-bold">₹{job.totalAmount}</span>
                    <div className="flex gap-2">
                        {job.status === 'PROVIDER_ASSIGNED' && onAction && (
                            <>
                                <Button size="sm" onClick={() => onAction(job.id, 'accept')}>Accept</Button>
                                <Button size="sm" variant="outline" onClick={() => onAction(job.id, 'reject')}>Reject</Button>
                            </>
                        )}
                        {job.status === 'CONFIRMED' && onAction && (
                            <Button size="sm" onClick={() => onAction(job.id, 'start')}>Start Job</Button>
                        )}
                        {job.status === 'SERVICE_STARTED' && onAction && (
                            <Button size="sm" onClick={() => onAction(job.id, 'complete')}>Complete Job</Button>
                        )}
                        <Button asChild variant="ghost" size="sm">
                            <Link href={`/provider/jobs/${job.id}`}>
                                Details <ChevronRight className="h-4 w-4 ml-1" />
                            </Link>
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}