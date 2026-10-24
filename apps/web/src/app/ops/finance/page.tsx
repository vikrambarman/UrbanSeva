"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import {
    IndianRupee, TrendingUp, Wallet, Clock, CheckCircle2, AlertCircle,
    Banknote, CreditCard, Zap, DollarSign, PieChart, Download, Receipt,
    XCircle, Search, RefreshCw
} from "lucide-react"
import { apiFetch } from "@/lib/api-client"
import { toast } from "sonner"

// ... (Interfaces for FinanceStats, GSTSummary, CategoryGST, Payout, Refund remain same as your previous code, adding Payout & Refund interfaces here)
interface Payout {
    id: string; amount: number; method: string; status: string; reference: string | null; createdAt: Date
    provider: { user: { name: string; phone: string } }
}
interface Refund {
    id: string; bookingNumber: string; totalAmount: number; paymentStatus: string; updatedAt: Date
    user: { name: string | null; phone: string }; service: { name: string }
}

export default function OpsFinancePage() {
    // Overview State
    const [stats, setStats] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    // GST State
    const [gstSummary, setGstSummary] = useState<any>(null)
    const [categoryGST, setCategoryGST] = useState<any[]>([])
    const [gstPeriod, setGstPeriod] = useState('month')
    const [gstLoading, setGstLoading] = useState(false)

    // Payouts State
    const [payouts, setPayouts] = useState<Payout[]>([])
    const [payoutsLoading, setPayoutsLoading] = useState(false)
    const [selectedPayout, setSelectedPayout] = useState<Payout | null>(null)
    const [payoutAction, setPayoutAction] = useState<'APPROVE' | 'REJECT'>('APPROVE')
    const [payoutTxnId, setPayoutTxnId] = useState('')
    const [payoutNotes, setPayoutNotes] = useState('')
    const [payoutProcessing, setPayoutProcessing] = useState(false)

    // Refunds State
    const [refunds, setRefunds] = useState<Refund[]>([])
    const [refundsLoading, setRefundsLoading] = useState(false)
    const [selectedRefund, setSelectedRefund] = useState<Refund | null>(null)
    const [refundAction, setRefundAction] = useState<'APPROVE' | 'REJECT'>('APPROVE')
    const [refundNotes, setRefundNotes] = useState('')
    const [refundProcessing, setRefundProcessing] = useState(false)

    useEffect(() => {
        fetchOverview()
        fetchGSTReport()
        fetchPayouts()
        fetchRefunds()
    }, [])

    useEffect(() => { fetchGSTReport() }, [gstPeriod])

    const fetchOverview = async () => {
        try {
            const res = await apiFetch('/api/ops/finance/stats', { cache: 'no-store' })
            const data = await res.json()
            if (data.success) setStats(data.data.stats)
        } catch (error) { console.error(error) } finally { setLoading(false) }
    }

    const fetchGSTReport = async () => {
        setGstLoading(true)
        try {
            const res = await apiFetch(`/api/ops/gst/report?period=${gstPeriod}`, { cache: 'no-store' })
            const data = await res.json()
            if (data.success) { setGstSummary(data.data.summary); setCategoryGST(data.data.categoryBreakdown) }
        } catch (error) { console.error(error) } finally { setGstLoading(false) }
    }

    const fetchPayouts = async () => {
        setPayoutsLoading(true)
        try {
            const res = await apiFetch('/api/ops/payouts?status=PENDING&limit=50', { cache: 'no-store' })
            const data = await res.json()
            if (data.success) setPayouts(data.data.payouts)
        } catch (error) { console.error(error) } finally { setPayoutsLoading(false) }
    }

    const fetchRefunds = async () => {
        setRefundsLoading(true)
        try {
            const res = await apiFetch('/api/ops/finance/refunds', { cache: 'no-store' })
            const data = await res.json()
            if (data.success) setRefunds(data.data)
        } catch (error) { console.error(error) } finally { setRefundsLoading(false) }
    }

    const handlePayoutProcess = async () => {
        if (!selectedPayout) return
        if (payoutAction === 'APPROVE' && !payoutTxnId.trim()) { toast.error('Transaction ID required'); return }
        if (payoutAction === 'REJECT' && !payoutNotes.trim()) { toast.error('Reason required'); return }

        setPayoutProcessing(true)
        try {
            const res = await apiFetch(`/api/ops/payouts/${selectedPayout.id}/approve`, {
                method: 'POST',
                body: JSON.stringify({ action: payoutAction, transactionId: payoutTxnId, rejectionReason: payoutNotes })
            })
            const data = await res.json()
            if (data.success) {
                toast.success(data.message)
                setSelectedPayout(null); setPayoutTxnId(''); setPayoutNotes('')
                fetchPayouts(); fetchOverview()
            } else toast.error(data.error)
        } catch (error) { toast.error('Failed') } finally { setPayoutProcessing(false) }
    }

    const handleRefundProcess = async () => {
        if (!selectedRefund) return
        setRefundProcessing(true)
        try {
            const res = await apiFetch('/api/ops/finance/refunds', {
                method: 'POST',
                body: JSON.stringify({ bookingId: selectedRefund.id, action: refundAction, notes: refundNotes })
            })
            const data = await res.json()
            if (data.success) {
                toast.success(data.message)
                setSelectedRefund(null); setRefundNotes('')
                fetchRefunds()
            } else toast.error(data.error)
        } catch (error) { toast.error('Failed') } finally { setRefundProcessing(false) }
    }

    const exportGSTCSV = () => {
        if (!gstSummary || categoryGST.length === 0) { toast.error('No data'); return }
        const headers = ['Category', 'Bookings', 'Base Amount', 'CGST', 'SGST', 'Total GST']
        const rows = categoryGST.map(c => [c.categoryName, c.bookingCount, c.totalBase, c.totalCGST, c.totalSGST, c.totalGST])
        rows.push(['TOTAL', gstSummary.totalBookings, gstSummary.totalBaseAmount, gstSummary.totalCGST, gstSummary.totalSGST, gstSummary.totalGST])
        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
        const blob = new Blob([csv], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a'); a.href = url; a.download = `GST_Report_${gstPeriod}.csv`; a.click()
        toast.success('Exported!')
    }

    if (loading) return <Skeleton className="h-96 w-full" />

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <DollarSign className="h-6 w-6 text-primary" />
                    Unified Financial Hub
                </h1>
                <p className="text-muted-foreground mt-1">Manage payouts, refunds, GST, and revenue in one place.</p>
            </div>

            <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="payouts">Payouts ({payouts.length})</TabsTrigger>
                    <TabsTrigger value="refunds">Refunds ({refunds.length})</TabsTrigger>
                    <TabsTrigger value="gst">GST Report</TabsTrigger>
                </TabsList>

                {/* TAB 1: OVERVIEW */}
                <TabsContent value="overview" className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Today's Revenue</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">₹{(stats?.todayRevenue || 0).toLocaleString()}</div></CardContent></Card>
                        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Platform Commission</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-orange-600">₹{(stats?.totalCommission || 0).toLocaleString()}</div></CardContent></Card>
                        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Payouts</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-blue-600">₹{(stats?.totalPayouts || 0).toLocaleString()}</div></CardContent></Card>
                        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Pending Payouts</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-amber-600">₹{(stats?.pendingPayouts || 0).toLocaleString()}</div></CardContent></Card>
                    </div>
                </TabsContent>

                {/* TAB 2: PAYOUTS */}
                <TabsContent value="payouts" className="space-y-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Pending Payout Requests</CardTitle>
                            <Button variant="outline" size="sm" onClick={fetchPayouts}><RefreshCw className="h-4 w-4 mr-1" /> Refresh</Button>
                        </CardHeader>
                        <CardContent>
                            {payoutsLoading ? <Skeleton className="h-40" /> : payouts.length === 0 ? (
                                <div className="text-center py-8"><CheckCircle2 className="h-10 w-10 text-green-500 mx-auto mb-2" /><p className="text-muted-foreground">No pending payouts</p></div>
                            ) : (
                                <div className="space-y-3">
                                    {payouts.map(p => (
                                        <div key={p.id} className="flex items-center justify-between p-4 border rounded-lg">
                                            <div>
                                                <p className="font-semibold">{p.provider.user.name}</p>
                                                <p className="text-xs text-muted-foreground">{p.provider.user.phone} • {p.method}</p>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <p className="text-xl font-bold">₹{p.amount.toLocaleString()}</p>
                                                <Button size="sm" onClick={() => { setSelectedPayout(p); setPayoutAction('APPROVE') }}>Process</Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* TAB 3: REFUNDS */}
                <TabsContent value="refunds" className="space-y-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Pending Refund Requests</CardTitle>
                            <Button variant="outline" size="sm" onClick={fetchRefunds}><RefreshCw className="h-4 w-4 mr-1" /> Refresh</Button>
                        </CardHeader>
                        <CardContent>
                            {refundsLoading ? <Skeleton className="h-40" /> : refunds.length === 0 ? (
                                <div className="text-center py-8"><CheckCircle2 className="h-10 w-10 text-green-500 mx-auto mb-2" /><p className="text-muted-foreground">No pending refunds</p></div>
                            ) : (
                                <div className="space-y-3">
                                    {refunds.map(r => (
                                        <div key={r.id} className="flex items-center justify-between p-4 border rounded-lg">
                                            <div>
                                                <p className="font-semibold">#{r.bookingNumber} • {r.user.name || r.user.phone}</p>
                                                <p className="text-xs text-muted-foreground">{r.service.name}</p>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <p className="text-xl font-bold text-red-600">₹{r.totalAmount.toLocaleString()}</p>
                                                <Button size="sm" variant="outline" onClick={() => { setSelectedRefund(r); setRefundAction('APPROVE') }}>Process</Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* TAB 4: GST REPORT */}
                <TabsContent value="gst" className="space-y-4">
                    <Card className="border-primary/20">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2"><Receipt className="h-5 w-5 text-primary" /> GST Collection</CardTitle>
                                <div className="flex gap-2">
                                    <Select value={gstPeriod} onValueChange={setGstPeriod}>
                                        <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="today">Today</SelectItem><SelectItem value="week">Week</SelectItem>
                                            <SelectItem value="month">Month</SelectItem><SelectItem value="quarter">Quarter</SelectItem>
                                            <SelectItem value="year">Year</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Button variant="outline" size="sm" onClick={exportGSTCSV}><Download className="h-4 w-4 mr-1" /> CSV</Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {gstLoading ? <Skeleton className="h-40" /> : gstSummary ? (
                                <>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                        <div className="p-3 bg-muted rounded-lg"><p className="text-xs text-muted-foreground">Total GST</p><p className="text-xl font-bold text-primary">₹{gstSummary.totalGST.toLocaleString()}</p></div>
                                        <div className="p-3 bg-muted rounded-lg"><p className="text-xs text-muted-foreground">CGST</p><p className="text-xl font-bold text-blue-600">₹{gstSummary.totalCGST.toLocaleString()}</p></div>
                                        <div className="p-3 bg-muted rounded-lg"><p className="text-xs text-muted-foreground">SGST</p><p className="text-xl font-bold text-green-600">₹{gstSummary.totalSGST.toLocaleString()}</p></div>
                                        <div className="p-3 bg-muted rounded-lg"><p className="text-xs text-muted-foreground">Base Amt</p><p className="text-xl font-bold">₹{gstSummary.totalBaseAmount.toLocaleString()}</p></div>
                                    </div>

                                    {/* ✅ FIX: Yahan se extra </TableRow> hata diya aur map ko format kiya */}
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Category</TableHead>
                                                <TableHead className="text-right">Bookings</TableHead>
                                                <TableHead className="text-right">CGST</TableHead>
                                                <TableHead className="text-right">SGST</TableHead>
                                                <TableHead className="text-right">Total GST</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {categoryGST.map(c => (
                                                <TableRow key={c.categoryId}>
                                                    <TableCell>{c.categoryName}</TableCell>
                                                    <TableCell className="text-right">{c.bookingCount}</TableCell>
                                                    <TableCell className="text-right text-blue-600">₹{c.totalCGST}</TableCell>
                                                    <TableCell className="text-right text-green-600">₹{c.totalSGST}</TableCell>
                                                    <TableCell className="text-right font-bold">₹{c.totalGST}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </>
                            ) : <p className="text-center text-muted-foreground py-8">No data</p>}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* PAYOUT MODAL */}
            <Dialog open={!!selectedPayout} onOpenChange={() => setSelectedPayout(null)}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Process Payout</DialogTitle><DialogDescription>Provider: {selectedPayout?.provider.user.name} | Amt: ₹{selectedPayout?.amount}</DialogDescription></DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="flex gap-2">
                            <Button variant={payoutAction === 'APPROVE' ? 'default' : 'outline'} onClick={() => setPayoutAction('APPROVE')} className="flex-1"><CheckCircle2 className="h-4 w-4 mr-1" /> Approve</Button>
                            <Button variant={payoutAction === 'REJECT' ? 'destructive' : 'outline'} onClick={() => setPayoutAction('REJECT')} className="flex-1"><XCircle className="h-4 w-4 mr-1" /> Reject</Button>
                        </div>
                        {payoutAction === 'APPROVE' ? (
                            <div className="space-y-2"><Label>Transaction ID / UTR *</Label><Input value={payoutTxnId} onChange={e => setPayoutTxnId(e.target.value)} placeholder="Enter UTR" /></div>
                        ) : (
                            <div className="space-y-2"><Label>Rejection Reason *</Label><Textarea value={payoutNotes} onChange={e => setPayoutNotes(e.target.value)} rows={2} /></div>
                        )}
                    </div>
                    <Button onClick={handlePayoutProcess} disabled={payoutProcessing} className="w-full">{payoutProcessing ? 'Processing...' : 'Confirm'}</Button>
                </DialogContent>
            </Dialog>

            {/* REFUND MODAL */}
            <Dialog open={!!selectedRefund} onOpenChange={() => setSelectedRefund(null)}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Process Refund</DialogTitle><DialogDescription>Booking: #{selectedRefund?.bookingNumber} | Amt: ₹{selectedRefund?.totalAmount}</DialogDescription></DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="flex gap-2">
                            <Button variant={refundAction === 'APPROVE' ? 'default' : 'outline'} onClick={() => setRefundAction('APPROVE')} className="flex-1 bg-green-600 hover:bg-green-700"><CheckCircle2 className="h-4 w-4 mr-1" /> Credit Wallet</Button>
                            <Button variant={refundAction === 'REJECT' ? 'destructive' : 'outline'} onClick={() => setRefundAction('REJECT')} className="flex-1"><XCircle className="h-4 w-4 mr-1" /> Reject</Button>
                        </div>
                        <div className="space-y-2"><Label>Notes (Optional)</Label><Textarea value={refundNotes} onChange={e => setRefundNotes(e.target.value)} rows={2} placeholder="Reason or remarks..." /></div>
                    </div>
                    <Button onClick={handleRefundProcess} disabled={refundProcessing} className="w-full">{refundProcessing ? 'Processing...' : 'Confirm'}</Button>
                </DialogContent>
            </Dialog>
        </div >
    )
}