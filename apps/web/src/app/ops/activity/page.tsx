// app/ops/activity/page.tsx
// KYA: Activity log page — staff ne kya kya actions liye
// KYUN: Accountability aur tracking ke liye

"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Activity, UserPlus, CalendarClock, XCircle, FileText } from "lucide-react"
import { apiFetch } from "@/lib/api-client"
import { useAuthStore } from "@/store/authStore"
import Link from "next/link"

interface ActivityLog {
    id: string
    bookingId: string
    action: string
    fromValue: string | null
    toValue: string | null
    notes: string | null
    createdAt: string
    booking: {
        bookingNumber: string
        user: { name: string | null; phone: string }
        service: { name: string }
    }
}

const actionConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
    PROVIDER_ASSIGNED: { label: 'Provider Assigned', icon: UserPlus, color: 'text-green-600 bg-green-50' },
    RESCHEDULED: { label: 'Rescheduled', icon: CalendarClock, color: 'text-blue-600 bg-blue-50' },
    CANCELLED: { label: 'Cancelled', icon: XCircle, color: 'text-red-600 bg-red-50' },
    NOTE_ADDED: { label: 'Note Added', icon: FileText, color: 'text-gray-600 bg-gray-50' },
}

export default function OpsActivityPage() {
    const router = useRouter()
    const { isAuthenticated } = useAuthStore()
    const [logs, setLogs] = useState<ActivityLog[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/ops/login')
            return
        }
        fetchActivity()
    }, [isAuthenticated, router])

    const fetchActivity = async () => {
        try {
            const res = await apiFetch('/api/ops/activity')
            const data = await res.json()
            if (data.success) {
                setLogs(data.data)
            }
        } catch (error) {
            console.error('Failed to fetch activity:', error)
        } finally {
            setLoading(false)
        }
    }

    const formatDateTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        })
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Activity className="h-6 w-6 text-primary" />
                    Activity Log
                </h1>
                <p className="text-muted-foreground mt-1">
                    Your recent actions on bookings
                </p>
            </div>

            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Recent Activities</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="space-y-3">
                            {[...Array(5)].map((_, i) => (
                                <Skeleton key={i} className="h-20 w-full" />
                            ))}
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="text-center py-12">
                            <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground">No activities yet</p>
                            <p className="text-sm text-muted-foreground mt-2">
                                Your actions on bookings will appear here
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {logs.map((log) => {
                                const config = actionConfig[log.action] || actionConfig.NOTE_ADDED
                                const Icon = config.icon

                                return (
                                    <Link
                                        key={log.id}
                                        href={`/ops/bookings/${log.bookingId}`}
                                        className="block"
                                    >
                                        <div className="flex gap-4 p-4 rounded-xl border hover:border-primary/50 hover:bg-primary/5 transition-all">
                                            {/* Action Icon */}
                                            <div className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${config.color}`}>
                                                <Icon className="h-5 w-5" />
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div>
                                                        <p className="font-medium text-sm">
                                                            {config.label}
                                                        </p>
                                                        <p className="text-sm text-muted-foreground mt-1">
                                                            Booking #{log.booking.bookingNumber} — {log.booking.service.name}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            Customer: {log.booking.user.name || log.booking.user.phone}
                                                        </p>
                                                    </div>
                                                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                                                        {formatDateTime(log.createdAt)}
                                                    </span>
                                                </div>

                                                {/* Change details */}
                                                {log.fromValue && log.toValue && (
                                                    <div className="mt-2 text-xs bg-muted rounded p-2">
                                                        <span className="text-muted-foreground">{log.fromValue}</span>
                                                        <span className="mx-2">→</span>
                                                        <span className="font-medium">{log.toValue}</span>
                                                    </div>
                                                )}

                                                {/* Notes */}
                                                {log.notes && (
                                                    <div className="mt-2 text-xs bg-muted/50 rounded p-2 italic">
                                                        {log.notes}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </Link>
                                )
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}