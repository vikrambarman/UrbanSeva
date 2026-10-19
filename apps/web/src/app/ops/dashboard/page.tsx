// apps/web/src/app/ops/dashboard/page.tsx
// CHANGE: Redundant auth check useEffect hata diya (middleware handle karega)
// CHANGE: Stats fetch mein cache: 'no-store' aur credentials: 'include' add kiya
// WHY: Refresh par redirect ho raha tha kyunki Zustand hydration se pehle isAuthenticated false tha.
//      Ab middleware handle karega auth, page sirf data fetch karega.

"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
    Clock, CheckCircle2, CalendarClock, XCircle,
    AlertCircle, ArrowRight, Headphones
} from "lucide-react"
import { apiFetch } from "@/lib/api-client"
import { useAuthStore } from "@/store/authStore"
import Link from "next/link"

interface CategoryStat {
    id: string
    name: string
    slug: string
    image: string | null
    pendingCount: number
}

interface DashboardStats {
    totalPending: number
    todayPending: number
    todayAssigned: number
    todayRescheduled: number
    todayCancelled: number
    totalUnassigned: number
    categoryStats: CategoryStat[]
    assignedCategories: { id: string; name: string; slug: string }[]
}

export default function OpsDashboardPage() {
    const { user } = useAuthStore()
    const [stats, setStats] = useState<DashboardStats | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchStats() // Initial fetch (with loading skeleton)

        // ✅ NEW: Auto-refresh dashboard stats every 30 seconds silently
        const interval = setInterval(() => {
            fetchStats(true) // silent refresh, no loading spinner
        }, 30000) // 30 seconds

        return () => clearInterval(interval) // Cleanup on unmount
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // ✅ FIX: silent parameter add kiya taaki auto-refresh par loading skeleton flash na ho
    const fetchStats = async (silent = false) => {
        try {
            const res = await apiFetch('/api/ops/bookings/stats', {
                cache: 'no-store',
                credentials: 'include',
            })
            const data = await res.json()
            if (data.success) {
                setStats(data.data)
            }
        } catch (error) {
            console.error('Failed to fetch stats:', error)
        } finally {
            if (!silent) setLoading(false) // Sirf pehli baar loading dikhayega
        }
    }

    if (loading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-8 w-64" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <Skeleton key={i} className="h-32 rounded-xl" />
                    ))}
                </div>
                <Skeleton className="h-64 rounded-xl" />
            </div>
        )
    }

    if (!stats) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Failed to load dashboard</p>
                    <Button onClick={() => fetchStats()} className="mt-4">Retry</Button>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* Welcome Header */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Headphones className="h-6 w-6 text-primary" />
                        Welcome, {user?.name || 'Team Member'}
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        {stats.assignedCategories.length > 0
                            ? `Managing: ${stats.assignedCategories.map(c => c.name).join(', ')}`
                            : 'No categories assigned — contact admin'
                        }
                    </p>
                </div>
                <Link href="/ops/bookings">
                    <Button>
                        View All Bookings
                        <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                </Link>
            </div>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* Stats Cards */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Pending */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total Pending
                        </CardTitle>
                        <Clock className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-amber-600">{stats.totalPending}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {stats.totalUnassigned} without provider
                        </p>
                    </CardContent>
                </Card>

                {/* Today's Pending */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Today&apos;s Pending
                        </CardTitle>
                        <CalendarClock className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-blue-600">{stats.todayPending}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Scheduled for today
                        </p>
                    </CardContent>
                </Card>

                {/* Today's Assigned */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Assigned Today
                        </CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-green-600">{stats.todayAssigned}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Providers assigned
                        </p>
                    </CardContent>
                </Card>

                {/* Today's Actions */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Other Actions
                        </CardTitle>
                        <XCircle className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">
                            {stats.todayRescheduled + stats.todayCancelled}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {stats.todayRescheduled} rescheduled, {stats.todayCancelled} cancelled
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* Category-wise Pending Bookings */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Category-wise Pending Bookings</CardTitle>
                </CardHeader>
                <CardContent>
                    {stats.categoryStats.length === 0 ? (
                        <div className="text-center py-8">
                            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground">
                                No categories assigned to you. Contact admin.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {stats.categoryStats.map((cat) => (
                                <Link
                                    key={cat.id}
                                    href={`/ops/bookings?categoryId=${cat.id}&status=PENDING`}
                                    className="block"
                                >
                                    <div className="flex items-center gap-4 p-4 rounded-xl border hover:border-primary/50 hover:bg-primary/5 transition-all group">
                                        {/* Category Image */}
                                        <div className="h-12 w-12 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                                            {cat.image ? (
                                                <img
                                                    src={cat.image}
                                                    alt={cat.name}
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <div className="h-full w-full flex items-center justify-center">
                                                    <Headphones className="h-5 w-5 text-muted-foreground" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Category Info */}
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-medium truncate group-hover:text-primary transition-colors">
                                                {cat.name}
                                            </h3>
                                            <p className="text-sm text-muted-foreground">
                                                Pending bookings
                                            </p>
                                        </div>

                                        {/* Count Badge */}
                                        <Badge
                                            variant={cat.pendingCount > 0 ? 'default' : 'secondary'}
                                            className="text-lg px-3 py-1"
                                        >
                                            {cat.pendingCount}
                                        </Badge>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* Quick Actions */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Link href="/ops/bookings?status=PENDING">
                            <div className="flex items-center gap-3 p-4 rounded-xl border hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer">
                                <Clock className="h-8 w-8 text-amber-500" />
                                <div>
                                    <h3 className="font-medium">Pending Bookings</h3>
                                    <p className="text-sm text-muted-foreground">Assign providers</p>
                                </div>
                            </div>
                        </Link>
                        <Link href="/ops/bookings?status=CONFIRMED">
                            <div className="flex items-center gap-3 p-4 rounded-xl border hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer">
                                <CheckCircle2 className="h-8 w-8 text-green-500" />
                                <div>
                                    <h3 className="font-medium">Confirmed Bookings</h3>
                                    <p className="text-sm text-muted-foreground">View & manage</p>
                                </div>
                            </div>
                        </Link>
                        <Link href="/ops/activity">
                            <div className="flex items-center gap-3 p-4 rounded-xl border hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer">
                                <CalendarClock className="h-8 w-8 text-blue-500" />
                                <div>
                                    <h3 className="font-medium">Activity Log</h3>
                                    <p className="text-sm text-muted-foreground">Your actions today</p>
                                </div>
                            </div>
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}