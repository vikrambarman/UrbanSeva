/**
 * WHAT: OPS Financial Dashboard with GST Tracking
 * WHY: OPS team ko financial overview + GST report mile
 */

"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
    IndianRupee, TrendingUp, Wallet, ArrowRight, 
    Clock, CheckCircle2, AlertCircle, Banknote,
    CreditCard, Zap, DollarSign, PieChart,
    FileText, Download, Receipt
} from "lucide-react"
import { apiFetch } from "@/lib/api-client"
import { toast } from "sonner"
import Link from "next/link"

interface FinanceStats {
    todayRevenue: number
    weekRevenue: number
    monthRevenue: number
    totalRevenue: number
    onlineRevenue: number
    podRevenue: number
    podPending: number
    totalCommission: number
    totalPayouts: number
    pendingPayouts: number
    todayBookings: number
    completedBookings: number
}

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

interface PendingPOD {
    id: string
    bookingNumber: string
    providerName: string
    providerPhone: string
    totalAmount: number
    codAmountCollected: number | null
    completedAt: Date
    serviceName: string
    customerName: string
}

interface RecentPayout {
    id: string
    providerName: string
    providerPhone: string
    amount: number
    method: string
    status: string
    createdAt: Date
    reference: string | null
}

export default function OpsFinancePage() {
    const [stats, setStats] = useState<FinanceStats | null>(null)
    const [pendingPODs, setPendingPODs] = useState<PendingPOD[]>([])
    const [recentPayouts, setRecentPayouts] = useState<RecentPayout[]>([])
    const [loading, setLoading] = useState(true)

    // GST State
    const [gstSummary, setGstSummary] = useState<GSTSummary | null>(null)
    const [categoryGST, setCategoryGST] = useState<CategoryGST[]>([])
    const [gstPeriod, setGstPeriod] = useState('month')
    const [gstLoading, setGstLoading] = useState(false)

    useEffect(() => {
        fetchFinanceData()
        fetchGSTReport()
    }, [])

    useEffect(() => {
        fetchGSTReport()
    }, [gstPeriod])

    const fetchFinanceData = async () => {
        try {
            const res = await apiFetch('/api/ops/finance/stats', { cache: 'no-store' })
            const data = await res.json()
            if (data.success) {
                setStats(data.data.stats)
                setPendingPODs(data.data.pendingPODs)
                setRecentPayouts(data.data.recentPayouts)
            }
        } catch (error) {
            console.error('Finance fetch error:', error)
            toast.error('Failed to load financial data')
        } finally {
            setLoading(false)
        }
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

        // Summary row
        rows.push([
            'TOTAL',
            gstSummary.totalBookings,
            gstSummary.totalBaseAmount,
            gstSummary.totalCGST,
            gstSummary.totalSGST,
            gstSummary.totalGST,
            gstSummary.totalCommission
        ])

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n')

        const blob = new Blob([csvContent], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `GST_Report_${gstPeriod}_${new Date().toISOString().split('T')[0]}.csv`
        a.click()
        window.URL.revokeObjectURL(url)
        toast.success('GST Report exported!')
    }

    if (loading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-8 w-64" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[...Array(8)].map((_, i) => (
                        <Skeleton key={i} className="h-32 rounded-xl" />
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <DollarSign className="h-6 w-6 text-primary" />
                        Financial Dashboard
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Revenue, payouts, GST, and settlement overview
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button asChild variant="outline">
                        <Link href="/ops/payouts">
                            Manage Payouts
                            <ArrowRight className="h-4 w-4 ml-2" />
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Revenue Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Today&apos;s Revenue</CardTitle>
                        <IndianRupee className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-green-600">₹{(stats?.todayRevenue || 0).toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground mt-1">{stats?.todayBookings || 0} bookings today</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">This Week</CardTitle>
                        <TrendingUp className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-blue-600">₹{(stats?.weekRevenue || 0).toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground mt-1">Last 7 days</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">This Month</CardTitle>
                        <TrendingUp className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-purple-600">₹{(stats?.monthRevenue || 0).toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">₹{(stats?.totalRevenue || 0).toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground mt-1">{stats?.completedBookings || 0} total completed</p>
                    </CardContent>
                </Card>
            </div>

            {/* Payment Method Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Online Payments</CardTitle>
                        <Zap className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">₹{(stats?.onlineRevenue || 0).toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground mt-1">Via Razorpay</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">POD Collected</CardTitle>
                        <Banknote className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">₹{(stats?.podRevenue || 0).toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground mt-1">Payment on Delivery</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">POD Pending</CardTitle>
                        <Clock className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-600">₹{(stats?.podPending || 0).toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground mt-1">Awaiting collection</p>
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
                            {/* GST Summary Cards */}
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

                            {/* Category-wise GST Table */}
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
                                            {/* Total Row */}
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

            {/* Commission & Payouts */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Platform Commission</CardTitle>
                        <PieChart className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-600">₹{(stats?.totalCommission || 0).toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground mt-1">Total earned</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Payouts</CardTitle>
                        <CreditCard className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">₹{(stats?.totalPayouts || 0).toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground mt-1">Paid to providers</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Pending Payouts</CardTitle>
                        <Wallet className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-600">₹{(stats?.pendingPayouts || 0).toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground mt-1">To be processed</p>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs: Pending PODs & Recent Payouts */}
            <Tabs defaultValue="pending-pods">
                <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
                    <TabsTrigger value="pending-pods">Pending POD ({pendingPODs.length})</TabsTrigger>
                    <TabsTrigger value="recent-payouts">Recent Payouts</TabsTrigger>
                </TabsList>

                <TabsContent value="pending-pods">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Clock className="h-5 w-5 text-amber-500" />
                                Pending POD Collections
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {pendingPODs.length === 0 ? (
                                <div className="text-center py-8">
                                    <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
                                    <p className="text-muted-foreground">All POD payments collected!</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {pendingPODs.map((pod) => (
                                        <div key={pod.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                                                    <Clock className="h-5 w-5 text-amber-600" />
                                                </div>
                                                <div>
                                                    <p className="font-medium">{pod.bookingNumber}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {pod.providerName} • {pod.serviceName}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        Customer: {pod.customerName}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-amber-600">₹{pod.totalAmount.toLocaleString()}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {pod.completedAt ? new Date(pod.completedAt).toLocaleDateString('en-IN') : ''}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="recent-payouts">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CreditCard className="h-5 w-5 text-green-500" />
                                Recent Payouts
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {recentPayouts.length === 0 ? (
                                <div className="text-center py-8">
                                    <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                    <p className="text-muted-foreground">No payouts yet.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {recentPayouts.map((payout) => (
                                        <div key={payout.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                                                    payout.status === 'COMPLETED' ? 'bg-green-100' : 
                                                    payout.status === 'FAILED' ? 'bg-red-100' : 'bg-amber-100'
                                                }`}>
                                                    {payout.status === 'COMPLETED' ? (
                                                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                                                    ) : payout.status === 'FAILED' ? (
                                                        <AlertCircle className="h-5 w-5 text-red-600" />
                                                    ) : (
                                                        <Clock className="h-5 w-5 text-amber-600" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-medium">{payout.providerName}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {payout.method} • {payout.reference || 'No reference'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold">₹{payout.amount.toLocaleString()}</p>
                                                <Badge variant={
                                                    payout.status === 'COMPLETED' ? 'default' : 
                                                    payout.status === 'FAILED' ? 'destructive' : 'secondary'
                                                }>
                                                    {payout.status}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}