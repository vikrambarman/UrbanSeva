"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { IndianRupee, TrendingUp, TrendingDown, Wallet, Receipt, Download, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { apiFetch } from "@/lib/api-client"

interface GSTSummary {
    totalRevenue: number
    totalBaseAmount: number
    totalGST: number
    totalCGST: number
    totalSGST: number
    totalCommission: number
    totalProviderEarning: number
    totalBookings: number
}

interface CategoryGST {
    categoryId: string
    categoryName: string
    totalBase: number
    totalGST: number
    totalCGST: number
    totalSGST: number
    commission: number
    bookingCount: number
}

export default function AdminFinancePage() {
    const [stats, setStats] = useState<any>(null)
    const [period, setPeriod] = useState("all")
    const [loading, setLoading] = useState(true)

    // GST State
    const [gstSummary, setGstSummary] = useState<GSTSummary | null>(null)
    const [categoryGST, setCategoryGST] = useState<CategoryGST[]>([])
    const [gstPeriod, setGstPeriod] = useState('month')
    const [gstLoading, setGstLoading] = useState(false)

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

    const fetchGSTReport = async () => {
        setGstLoading(true)
        try {
            const res = await apiFetch(`/api/ops/gst/report?period=${gstPeriod}`, { cache: 'no-store' })
            const data = await res.json()
            if (data.success) {
                setGstSummary(data.data.summary)
                setCategoryGST(data.data.categoryBreakdown)
            }
        } catch (error) {
            console.error('GST fetch error:', error)
        } finally {
            setGstLoading(false)
        }
    }

    useEffect(() => { fetchStats() }, [period])
    useEffect(() => { fetchGSTReport() }, [gstPeriod])

    const exportGSTCSV = () => {
        if (!gstSummary || categoryGST.length === 0) {
            toast.error('No data to export')
            return
        }

        const headers = ['Category', 'Bookings', 'Base Amount', 'CGST', 'SGST', 'Total GST', 'Commission']
        const rows = categoryGST.map(cat => [
            cat.categoryName,
            cat.bookingCount,
            cat.totalBase,
            cat.totalCGST,
            cat.totalSGST,
            cat.totalGST,
            cat.commission
        ])

        rows.push([
            'TOTAL',
            gstSummary.totalBookings,
            gstSummary.totalBaseAmount,
            gstSummary.totalCGST,
            gstSummary.totalSGST,
            gstSummary.totalGST,
            gstSummary.totalCommission
        ])

        const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
        const blob = new Blob([csvContent], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `GST_Report_${gstPeriod}_${new Date().toISOString().split('T')[0]}.csv`
        a.click()
        window.URL.revokeObjectURL(url)
        toast.success('GST Report exported!')
    }

    if (loading && !stats) {
        return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Financial Dashboard</h1>
                    <p className="text-muted-foreground">Overview of platform revenue, commissions, GST, and payouts.</p>
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

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* GST SECTION - NEW */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <Card className="border-primary/20 bg-gradient-to-br from-orange-50 to-amber-50">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Receipt className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <CardTitle className="text-lg">GST Collection Report</CardTitle>
                                <p className="text-sm text-muted-foreground">
                                    Intra-state (CGST + SGST) • Ambikapur, Chhattisgarh
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Select value={gstPeriod} onValueChange={setGstPeriod}>
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="today">Today</SelectItem>
                                    <SelectItem value="week">This Week</SelectItem>
                                    <SelectItem value="month">This Month</SelectItem>
                                    <SelectItem value="quarter">This Quarter</SelectItem>
                                    <SelectItem value="year">This Year</SelectItem>
                                    <SelectItem value="all">All Time</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button variant="outline" size="sm" onClick={exportGSTCSV} disabled={gstLoading}>
                                <Download className="h-4 w-4 mr-1" />
                                Export CSV
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {gstLoading ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[...Array(4)].map((_, i) => (
                                <Skeleton key={i} className="h-20 rounded-lg" />
                            ))}
                        </div>
                    ) : gstSummary ? (
                        <>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="p-4 bg-white rounded-lg border">
                                    <p className="text-xs text-muted-foreground font-medium">Total GST Collected</p>
                                    <p className="text-2xl font-bold text-primary mt-1">
                                        ₹{gstSummary.totalGST.toLocaleString()}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        On {gstSummary.totalBookings} bookings
                                    </p>
                                </div>
                                <div className="p-4 bg-white rounded-lg border">
                                    <p className="text-xs text-muted-foreground font-medium">CGST (9%)</p>
                                    <p className="text-2xl font-bold text-blue-600 mt-1">
                                        ₹{gstSummary.totalCGST.toLocaleString()}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">Central Govt</p>
                                </div>
                                <div className="p-4 bg-white rounded-lg border">
                                    <p className="text-xs text-muted-foreground font-medium">SGST (9%)</p>
                                    <p className="text-2xl font-bold text-green-600 mt-1">
                                        ₹{gstSummary.totalSGST.toLocaleString()}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">State Govt (CG)</p>
                                </div>
                                <div className="p-4 bg-white rounded-lg border">
                                    <p className="text-xs text-muted-foreground font-medium">Base Amount</p>
                                    <p className="text-2xl font-bold mt-1">
                                        ₹{gstSummary.totalBaseAmount.toLocaleString()}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">Before GST</p>
                                </div>
                            </div>

                            {categoryGST.length > 0 && (
                                <div className="border rounded-lg overflow-hidden">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-muted/50">
                                                <TableHead>Category</TableHead>
                                                <TableHead className="text-right">Bookings</TableHead>
                                                <TableHead className="text-right">Base Amount</TableHead>
                                                <TableHead className="text-right">CGST</TableHead>
                                                <TableHead className="text-right">SGST</TableHead>
                                                <TableHead className="text-right">Total GST</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {categoryGST.map((cat) => (
                                                <TableRow key={cat.categoryId}>
                                                    <TableCell className="font-medium">{cat.categoryName}</TableCell>
                                                    <TableCell className="text-right">{cat.bookingCount}</TableCell>
                                                    <TableCell className="text-right">₹{cat.totalBase.toLocaleString()}</TableCell>
                                                    <TableCell className="text-right text-blue-600">₹{cat.totalCGST.toLocaleString()}</TableCell>
                                                    <TableCell className="text-right text-green-600">₹{cat.totalSGST.toLocaleString()}</TableCell>
                                                    <TableCell className="text-right font-semibold">₹{cat.totalGST.toLocaleString()}</TableCell>
                                                </TableRow>
                                            ))}
                                            <TableRow className="bg-primary/5 font-bold">
                                                <TableCell>TOTAL</TableCell>
                                                <TableCell className="text-right">{gstSummary.totalBookings}</TableCell>
                                                <TableCell className="text-right">₹{gstSummary.totalBaseAmount.toLocaleString()}</TableCell>
                                                <TableCell className="text-right text-blue-600">₹{gstSummary.totalCGST.toLocaleString()}</TableCell>
                                                <TableCell className="text-right text-green-600">₹{gstSummary.totalSGST.toLocaleString()}</TableCell>
                                                <TableCell className="text-right text-primary">₹{gstSummary.totalGST.toLocaleString()}</TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-center py-8">
                            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground">No GST data available for this period</p>
                        </div>
                    )}
                </CardContent>
            </Card>

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