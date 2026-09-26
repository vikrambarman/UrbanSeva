"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { IndianRupee, TrendingUp, TrendingDown, Wallet, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { apiFetch } from "@/lib/api-client"

export default function AdminFinancePage() {
    const [stats, setStats] = useState<any>(null)
    const [period, setPeriod] = useState("all")
    const [loading, setLoading] = useState(true)

    const fetchStats = async () => {
        setLoading(true)
        try {
            const res = await apiFetch(`/api/admin/finance/stats?period=${period}`)
            const data = await res.json()
            if (data.success) setStats(data.data)
            else toast.error(data.error)
        } catch { toast.error("Failed to fetch stats") } 
        finally { setLoading(false) }
    }

    useEffect(() => { fetchStats() }, [period])

    if (loading && !stats) {
        return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Financial Dashboard</h1>
                    <p className="text-muted-foreground">Overview of platform revenue, commissions, and payouts.</p>
                </div>
                <Select value={period} onValueChange={setPeriod}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select Period" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="week">Last 7 Days</SelectItem>
                        <SelectItem value="month">Last 30 Days</SelectItem>
                        <SelectItem value="all">All Time</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        <IndianRupee className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹{(stats?.totalRevenue || 0).toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">{stats?.totalBookings || 0} paid bookings</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Platform Commission</CardTitle>
                        <TrendingUp className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-primary">₹{(stats?.platformCommission || 0).toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">Net platform earnings</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Payouts</CardTitle>
                        <Wallet className="h-4 w-4 text-yellow-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹{(stats?.pendingPayouts || 0).toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">To be paid to providers</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Refunds</CardTitle>
                        <TrendingDown className="h-4 w-4 text-destructive" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-destructive">₹{(stats?.totalRefunds || 0).toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">{stats?.refundCount || 0} refund requests</p>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Links */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Manage Payouts</CardTitle>
                        <p className="text-sm text-muted-foreground">Process pending payouts to service providers.</p>
                    </CardHeader>
                    <CardContent>
                        <Button asChild>
                            <Link href="/admin/finance/payouts">View Payouts</Link>
                        </Button>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Manage Refunds</CardTitle>
                        <p className="text-sm text-muted-foreground">Review and process customer refund requests.</p>
                    </CardHeader>
                    <CardContent>
                        <Button asChild variant="outline">
                            <Link href="/admin/finance/refunds">View Refunds</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}