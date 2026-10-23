"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { IndianRupee, TrendingUp, TrendingDown, Wallet, Receipt, Download, AlertCircle, RefreshCw, Banknote, CreditCard } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { apiFetch } from "@/lib/api-client"
import { PayoutTable } from "@/components/admin/PayoutTable" // Ensure this path matches your component location
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

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

    // NEW: Payouts State
    const [payouts, setPayouts] = useState<any[]>([])
    const [payoutsLoading, setPayoutsLoading] = useState(false)

    // NEW: Earnings Summary State
    const [earningsSummary, setEarningsSummary] = useState<any[]>([])
    const [earningsLoading, setEarningsLoading] = useState(false)


    // NEW: Manual Payout States
    const [manualPayoutOpen, setManualPayoutOpen] = useState(false)
    const [manualPayoutLoading, setManualPayoutLoading] = useState(false)
    const [manualData, setManualData] = useState({
        providerId: '',
        amount: '',
        method: 'BANK_TRANSFER',
        bankDetails: '',
        upiId: '',
        notes: ''
    })

    const handleManualPayout = async () => {
        if (!manualData.providerId || !manualData.amount || parseFloat(manualData.amount) <= 0) {
            toast.error('Please enter valid Provider ID and Amount')
            return
        }
        if (manualData.method === 'BANK_TRANSFER' && !manualData.bankDetails.trim()) {
            toast.error('Bank details required')
            return
        }
        if (manualData.method === 'UPI' && !manualData.upiId.trim()) {
            toast.error('UPI ID required')
            return
        }

        setManualPayoutLoading(true)
        try {
            const res = await apiFetch('/api/admin/finance/payouts/manual', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...manualData,
                    amount: parseFloat(manualData.amount)
                })
            })
            const data = await res.json()
            if (data.success) {
                toast.success('Manual payout initiated successfully!')
                setManualPayoutOpen(false)
                setManualData({ providerId: '', amount: '', method: 'BANK_TRANSFER', bankDetails: '', upiId: '', notes: '' })
                fetchStats()
                fetchPayouts()
                fetchEarningsSummary()
            } else {
                toast.error(data.error || 'Failed to process payout')
            }
        } catch (error) {
            toast.error('Failed to process manual payout')
        } finally {
            setManualPayoutLoading(false)
        }
    }

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

    // NEW: Fetch Pending Payouts
    const fetchPayouts = async () => {
        setPayoutsLoading(true)
        try {
            const res = await apiFetch('/api/admin/finance/payouts?status=PENDING', { cache: 'no-store' })
            const data = await res.json()
            if (data.success) setPayouts(data.data)
        } catch (error) {
            console.error('Payouts fetch error:', error)
        } finally {
            setPayoutsLoading(false)
        }
    }

    // NEW: Fetch Provider Earnings Summary
    const fetchEarningsSummary = async () => {
        setEarningsLoading(true)
        try {
            const res = await apiFetch('/api/admin/finance/earnings/summary', { cache: 'no-store' })
            const data = await res.json()
            if (data.success) setEarningsSummary(data.data)
            } catch (error) {
        console.error('Earnings summary fetch error:', error)
    } finally {
        setEarningsLoading(false)
        console.log(earningsSummary)
        }
    }

    // NEW: Process Payout (Mark as Paid)
    const handleProcessPayout = async (payoutId: string) => {
        try {
            const res = await apiFetch('/api/admin/finance/payouts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ payoutId })
            })
            const data = await res.json()
            if (data.success) {
                toast.success('Payout marked as completed!')
                fetchPayouts()
                fetchStats() // Refresh stats to update pending payouts amount
            } else {
                toast.error(data.error || 'Failed to process payout')
            }
        } catch (error) {
            toast.error('Failed to process payout')
        }
    }

    useEffect(() => { fetchStats() }, [period])
    useEffect(() => { fetchGSTReport() }, [gstPeriod])
    useEffect(() => {
        fetchPayouts()
        fetchEarningsSummary()
    }, [])

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
                <div className="flex items-center gap-2">
                    {/* ✅ NEW: Manual Payout Button */}
                    <Button onClick={() => setManualPayoutOpen(true)} variant="outline">
                        <Banknote className="h-4 w-4 mr-2" /> Manual Payout
                    </Button>
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

            {/* NEW: Pending Payouts Section */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Pending Payouts</CardTitle>
                            <p className="text-sm text-muted-foreground">Manual payout processing for providers.</p>
                        </div>
                        <Button variant="outline" size="sm" onClick={fetchPayouts} disabled={payoutsLoading}>
                            <RefreshCw className={`h-4 w-4 mr-2 ${payoutsLoading ? 'animate-spin' : ''}`} /> Refresh
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {payoutsLoading ? (
                        <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div></div>
                    ) : (
                        <PayoutTable payouts={payouts} onProcess={handleProcessPayout} />
                    )}
                </CardContent>
            </Card>

            {/* Provider Earnings Summary */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Provider Earnings Summary</CardTitle>
                            <p className="text-sm text-muted-foreground">Complete earnings breakdown per provider (All Time)</p>
                        </div>
                        <Button variant="outline" size="sm" onClick={fetchEarningsSummary} disabled={earningsLoading}>
                            <RefreshCw className={`h-4 w-4 mr-2 ${earningsLoading ? 'animate-spin' : ''}`} /> Refresh
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {earningsLoading ? (
                        <Skeleton className="h-32" />
                    ) : earningsSummary.length > 0 ? (
                        <div className="rounded-md border overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Provider</TableHead>
                                        <TableHead className="text-right">Bookings</TableHead>
                                        <TableHead className="text-right">Gross Earnings</TableHead>
                                        <TableHead className="text-right">Commission</TableHead>
                                        <TableHead className="text-right">Net Earnings</TableHead>
                                        <TableHead className="text-right">Paid</TableHead>
                                        <TableHead className="text-right">Pending</TableHead>
                                        <TableHead className="text-right">Wallet Balance</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {earningsSummary.map((item: any) => (
                                        <TableRow key={item.providerId}>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{item.providerName}</span>
                                                    {item.providerPhone && (
                                                        <span className="text-xs text-muted-foreground">{item.providerPhone}</span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <span className="font-medium">{item.totalJobs || 0}</span>
                                                <p className="text-xs text-muted-foreground">{item.bookingCount || 0} earnings</p>
                                            </TableCell>
                                            <TableCell className="text-right">₹{item.gross.toLocaleString()}</TableCell>
                                            <TableCell className="text-right text-primary">₹{item.commission.toLocaleString()}</TableCell>
                                            <TableCell className="text-right font-semibold text-green-600">₹{item.net.toLocaleString()}</TableCell>
                                            <TableCell className="text-right text-blue-600">₹{item.paid.toLocaleString()}</TableCell>
                                            <TableCell className="text-right">
                                                <span className="font-semibold text-amber-600">₹{item.pending.toLocaleString()}</span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <span className="font-semibold">₹{item.walletBalance.toLocaleString()}</span>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {/* ✅ NEW: Total Row */}
                                    <TableRow className="bg-muted/50 font-bold">
                                        <TableCell>TOTAL</TableCell>
                                        <TableCell className="text-right">
                                            {earningsSummary.reduce((sum, item) => sum + (item.totalJobs || 0), 0)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            ₹{earningsSummary.reduce((sum, item) => sum + item.gross, 0).toLocaleString()}
                                        </TableCell>
                                        <TableCell className="text-right text-primary">
                                            ₹{earningsSummary.reduce((sum, item) => sum + item.commission, 0).toLocaleString()}
                                        </TableCell>
                                        <TableCell className="text-right text-green-600">
                                            ₹{earningsSummary.reduce((sum, item) => sum + item.net, 0).toLocaleString()}
                                        </TableCell>
                                        <TableCell className="text-right text-blue-600">
                                            ₹{earningsSummary.reduce((sum, item) => sum + item.paid, 0).toLocaleString()}
                                        </TableCell>
                                        <TableCell className="text-right text-amber-600">
                                            ₹{earningsSummary.reduce((sum, item) => sum + item.pending, 0).toLocaleString()}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            ₹{earningsSummary.reduce((sum, item) => sum + item.walletBalance, 0).toLocaleString()}
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground">No earnings data available.</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* GST SECTION */}
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


            {/* Manual Payout Dialog - Improved */}
            <Dialog open={manualPayoutOpen} onOpenChange={setManualPayoutOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Initiate Manual Payout</DialogTitle>
                        <DialogDescription>
                            Pay a provider directly. Select from providers with wallet balance.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        {/* ✅ NEW: Provider Selector with Wallet Balance */}
                        <div className="space-y-2">
                            <Label>Select Provider *</Label>
                            <Select
                                value={manualData.providerId}
                                onValueChange={(val) => setManualData({ ...manualData, providerId: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Choose a provider" />
                                </SelectTrigger>
                                <SelectContent>
                                    {earningsSummary
                                        .filter(p => p.walletBalance > 0)
                                        .map((provider) => (
                                            <SelectItem key={provider.providerId} value={provider.providerId}>
                                                <div className="flex justify-between w-full">
                                                    <span>{provider.providerName}</span>
                                                    <span className="text-muted-foreground ml-4">
                                                        Balance: ₹{provider.walletBalance.toLocaleString()}
                                                    </span>
                                                </div>
                                            </SelectItem>
                                        ))
                                    }
                                </SelectContent>
                            </Select>
                            {earningsSummary.filter(p => p.walletBalance > 0).length === 0 && (
                                <p className="text-xs text-muted-foreground">No providers with available balance</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label>Amount (₹) *</Label>
                            <Input
                                type="number"
                                value={manualData.amount}
                                onChange={(e) => setManualData({ ...manualData, amount: e.target.value })}
                                placeholder="Enter amount"
                                max={
                                    earningsSummary.find(p => p.providerId === manualData.providerId)?.walletBalance || 0
                                }
                            />
                            {manualData.providerId && (
                                <p className="text-xs text-muted-foreground">
                                    Available: ₹{
                                        (earningsSummary.find(p => p.providerId === manualData.providerId)?.walletBalance || 0).toLocaleString()
                                    }
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label>Payout Method *</Label>
                            <Select value={manualData.method} onValueChange={(val) => setManualData({ ...manualData, method: val })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="BANK_TRANSFER">
                                        <div className="flex items-center gap-2"><CreditCard className="h-4 w-4" /> Bank Transfer</div>
                                    </SelectItem>
                                    <SelectItem value="UPI">
                                        <div className="flex items-center gap-2"><Banknote className="h-4 w-4" /> UPI</div>
                                    </SelectItem>
                                    <SelectItem value="CASH">
                                        <div className="flex items-center gap-2"><Banknote className="h-4 w-4" /> Cash (Offline)</div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {manualData.method === 'BANK_TRANSFER' && (
                            <div className="space-y-2">
                                <Label>Bank Account Details *</Label>
                                <Input
                                    value={manualData.bankDetails}
                                    onChange={(e) => setManualData({ ...manualData, bankDetails: e.target.value })}
                                    placeholder="Account No, IFSC, Bank Name"
                                />
                            </div>
                        )}

                        {manualData.method === 'UPI' && (
                            <div className="space-y-2">
                                <Label>UPI ID *</Label>
                                <Input
                                    value={manualData.upiId}
                                    onChange={(e) => setManualData({ ...manualData, upiId: e.target.value })}
                                    placeholder="name@upi"
                                />
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label>Notes (Optional)</Label>
                            <Input
                                value={manualData.notes}
                                onChange={(e) => setManualData({ ...manualData, notes: e.target.value })}
                                placeholder="Transaction reference, UTR number, etc."
                            />
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="outline" onClick={() => setManualPayoutOpen(false)} className="flex-1">Cancel</Button>
                        <Button onClick={handleManualPayout} disabled={manualPayoutLoading} className="flex-1">
                            {manualPayoutLoading ? 'Processing...' : 'Initiate Payout'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>

    )
}