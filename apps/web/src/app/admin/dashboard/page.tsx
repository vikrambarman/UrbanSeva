"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Users, Briefcase, Calendar, IndianRupee, TrendingUp, ArrowRight } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { apiFetch } from "@/lib/api-client"

export default function AdminDashboardPage() {
    const [stats, setStats] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchStats = async () => {
            try {
                console.log('🔍 Fetching dashboard stats...')
                
                const res = await apiFetch('/api/admin/dashboard')
                
                // ✅ FIX: Check if response is valid
                if (!res || !res.ok) {
                    console.error('❌ Invalid response:', res)
                    toast.error("Failed to load dashboard - Invalid response")
                    setLoading(false)
                    return
                }
                
                const data = await res.json()
                console.log('📦 Dashboard data received:', data)
                
                if (data.success) {
                    setStats(data.data)
                } else {
                    toast.error(data.error || "Failed to load dashboard")
                    console.error('Dashboard API Error:', data)
                }
            } catch (error) {
                console.error('Dashboard fetch error:', error)
                toast.error("Failed to load dashboard: " + (error instanceof Error ? error.message : 'Unknown error'))
            } finally {
                setLoading(false)
            }
        }
        fetchStats()
    }, [])

    if (loading) {
        return (
            <div className="flex justify-center items-center h-96">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
            </div>
        )
    }

    // ✅ ADD: No data fallback
    if (!stats) {
        return (
            <div className="flex flex-col justify-center items-center h-96 space-y-4">
                <p className="text-muted-foreground">Failed to load dashboard data</p>
                <Button onClick={() => window.location.reload()}>Retry</Button>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-muted-foreground">Welcome back! Here&apos;s what&apos;s happening with your platform today.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
                        <Users className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
                        <p className="text-xs text-muted-foreground">Registered users</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Providers</CardTitle>
                        <Briefcase className="h-4 w-4 text-purple-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.totalProviders || 0}</div>
                        <p className="text-xs text-muted-foreground">Active service providers</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
                        <Calendar className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.totalBookings || 0}</div>
                        <p className="text-xs text-muted-foreground">{stats?.pendingBookings || 0} pending approvals</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        <IndianRupee className="h-4 w-4 text-emerald-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹{(stats?.totalRevenue || 0).toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" /> Lifetime earnings
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Recent Bookings</CardTitle>
                        <p className="text-sm text-muted-foreground">Latest 5 bookings placed on the platform.</p>
                    </div>
                    <Button asChild variant="outline" size="sm">
                        <Link href="/admin/bookings">
                            View All <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Booking #</TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Service</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {stats?.recentBookings?.length > 0 ? (
                                    stats.recentBookings.map((booking: any) => (
                                        <TableRow key={booking.id}>
                                            <TableCell className="font-medium">{booking.bookingNumber}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span>{booking.user.name || "Guest"}</span>
                                                    <span className="text-xs text-muted-foreground">{booking.user.phone}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>{booking.service.name}</TableCell>
                                            <TableCell>₹{booking.totalAmount}</TableCell>
                                            <TableCell>
                                                <Badge variant={
                                                    booking.status === 'PENDING' ? 'secondary' : 
                                                    booking.status === 'CANCELLED' ? 'destructive' : 'default'
                                                }>
                                                    {booking.status.replace(/_/g, ' ')}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                            No recent bookings found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}