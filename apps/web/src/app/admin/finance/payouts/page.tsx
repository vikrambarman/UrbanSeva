"use client"

import { useEffect, useState } from "react"
import { PayoutTable } from "@/components/admin/PayoutTable"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, IndianRupee, CheckCircle, Clock, AlertCircle, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { apiFetch } from "@/lib/api-client"

export default function AdminPayoutsPage() {
    const [payouts, setPayouts] = useState<any[]>([])
    const [status, setStatus] = useState("ALL")
    const [loading, setLoading] = useState(true)

    // ✅ NEW: Process Payout Dialog
    const [processDialogOpen, setProcessDialogOpen] = useState(false)
    const [selectedPayout, setSelectedPayout] = useState<any>(null)
    const [processingNotes, setProcessingNotes] = useState('')
    const [processing, setProcessing] = useState(false)

    // ✅ NEW: Payout Summary
    const [summary, setSummary] = useState<any>(null)

    const fetchPayouts = async () => {
        setLoading(true)
        try {
            const res = await apiFetch(`/api/admin/finance/payouts?status=${status}`, { cache: 'no-store' })
            const data = await res.json()
            if (data.success) setPayouts(data.data)
            else toast.error(data.error)
        } catch { toast.error("Failed to fetch payouts") } 
        finally { setLoading(false) }
    }

    const fetchSummary = async () => {
        try {
            const res = await apiFetch('/api/admin/finance/payouts/summary', { cache: 'no-store' })
            const data = await res.json()
            if (data.success) setSummary(data.data)
        } catch (error) {
            console.error('Summary fetch error:', error)
        }
    }

    useEffect(() => { 
        fetchPayouts()
        fetchSummary()
    }, [status])

    // ✅ NEW: Open Process Dialog with Payout Details
    const handleProcessPayout = (payoutId: string) => {
        const payout = payouts.find(p => p.id === payoutId)
        if (!payout) {
            toast.error('Payout not found')
            return
        }
        setSelectedPayout(payout)
        setProcessingNotes('')
        setProcessDialogOpen(true)
    }

    // ✅ NEW: Confirm and Process Payout
    const confirmProcessPayout = async () => {
        if (!selectedPayout) return

        setProcessing(true)
        try {
            const res = await apiFetch('/api/admin/finance/payouts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    payoutId: selectedPayout.id,
                    notes: processingNotes 
                })
            })
            const data = await res.json()
            if (data.success) { 
                toast.success("Payout marked as paid successfully!")
                setProcessDialogOpen(false)
                setSelectedPayout(null)
                fetchPayouts()
                fetchSummary()
            }
            else toast.error(data.error)
        } catch { toast.error("Failed to process payout") }
        finally { setProcessing(false) }
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center gap-4">
                <Button asChild variant="ghost" size="icon">
                    <Link href="/admin/finance"><ArrowLeft className="h-4 w-4" /></Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Payout Management</h1>
                    <p className="text-muted-foreground">Review and process provider payouts with full details.</p>
                </div>
            </div>

            {/* ✅ NEW: Payout Summary Cards */}
            {summary && (
                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Paid (All Time)</CardTitle>
                            <IndianRupee className="h-4 w-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">₹{summary.totalPaid.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground">{summary.completedCount} payouts completed</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Pending Payouts</CardTitle>
                            <Clock className="h-4 w-4 text-amber-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-amber-600">₹{summary.totalPending.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground">{summary.pendingCount} awaiting payment</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">This Month</CardTitle>
                            <CheckCircle className="h-4 w-4 text-blue-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600">₹{summary.thisMonth.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground">{summary.thisMonthCount} payouts</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Providers Paid</CardTitle>
                            <IndianRupee className="h-4 w-4 text-purple-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-purple-600">{summary.uniqueProviders}</div>
                            <p className="text-xs text-muted-foreground">Unique providers</p>
                        </CardContent>
                    </Card>
                </div>
            )}

            <div className="flex items-center gap-4">
                <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">All Statuses</SelectItem>
                        <SelectItem value="PENDING">Pending</SelectItem>
                        <SelectItem value="PROCESSING">Processing</SelectItem>
                        <SelectItem value="COMPLETED">Completed</SelectItem>
                    </SelectContent>
                </Select>
                <Button variant="outline" size="sm" onClick={fetchPayouts} disabled={loading}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh
                </Button>
            </div>

            {loading ? (
                <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
            ) : (
                <PayoutTable payouts={payouts} onProcess={handleProcessPayout} />
            )}

            {/* ✅ NEW: Process Payout Dialog with Full Details */}
            <Dialog open={processDialogOpen} onOpenChange={setProcessDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Review & Confirm Payout</DialogTitle>
                        <DialogDescription>
                            Verify all details before marking this payout as completed.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedPayout && (
                        <div className="space-y-6 py-4">
                            {/* Provider Details */}
                            <div className="p-4 bg-muted rounded-lg space-y-2">
                                <h4 className="font-semibold text-sm">Provider Details</h4>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-muted-foreground">Name</p>
                                        <p className="font-medium">{selectedPayout.provider.user.name || 'Unnamed'}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Phone</p>
                                        <p className="font-medium">{selectedPayout.provider.user.phone}</p>
                                    </div>
                                    {selectedPayout.provider.user.email && (
                                        <div>
                                            <p className="text-muted-foreground">Email</p>
                                            <p className="font-medium">{selectedPayout.provider.user.email}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Payment Details */}
                            <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg space-y-3">
                                <h4 className="font-semibold text-sm">Payment Details</h4>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Amount</span>
                                    <span className="text-2xl font-bold text-primary">₹{selectedPayout.amount.toLocaleString()}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-muted-foreground">Payment Method</p>
                                        <p className="font-medium">{selectedPayout.method.replace('_', ' ')}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Requested On</p>
                                        <p className="font-medium">{new Date(selectedPayout.createdAt).toLocaleDateString('en-IN')}</p>
                                    </div>
                                </div>

                                {/* Bank/UPI Details */}
                                {selectedPayout.method === 'BANK_TRANSFER' && (
                                    <div className="pt-3 border-t space-y-2">
                                        <p className="text-sm font-semibold">Bank Account Details</p>
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            {selectedPayout.bankAccount && (
                                                <div>
                                                    <p className="text-muted-foreground">Account Number</p>
                                                    <p className="font-medium font-mono">{selectedPayout.bankAccount}</p>
                                                </div>
                                            )}
                                            {selectedPayout.bankIFSC && (
                                                <div>
                                                    <p className="text-muted-foreground">IFSC Code</p>
                                                    <p className="font-medium font-mono">{selectedPayout.bankIFSC}</p>
                                                </div>
                                            )}
                                            {selectedPayout.bankName && (
                                                <div>
                                                    <p className="text-muted-foreground">Bank Name</p>
                                                    <p className="font-medium">{selectedPayout.bankName}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {selectedPayout.method === 'UPI' && selectedPayout.upiId && (
                                    <div className="pt-3 border-t">
                                        <p className="text-sm font-semibold">UPI Details</p>
                                        <p className="font-medium font-mono mt-1">{selectedPayout.upiId}</p>
                                    </div>
                                )}

                                {selectedPayout.notes && (
                                    <div className="pt-3 border-t">
                                        <p className="text-sm font-semibold">Provider Notes</p>
                                        <p className="text-sm mt-1">{selectedPayout.notes}</p>
                                    </div>
                                )}
                            </div>

                            {/* Admin Notes */}
                            <div className="space-y-2">
                                <Label>Admin Notes (Optional)</Label>
                                <Input
                                    value={processingNotes}
                                    onChange={(e) => setProcessingNotes(e.target.value)}
                                    placeholder="Add transaction reference, UTR number, or any notes..."
                                />
                            </div>

                            {/* Confirmation Warning */}
                            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                <div className="flex items-start gap-2">
                                    <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                    <div className="text-sm">
                                        <p className="font-semibold text-amber-900">Confirm Payment</p>
                                        <p className="text-amber-800 mt-1">
                                            Please ensure you have actually transferred ₹{selectedPayout.amount.toLocaleString()} to the provider via {selectedPayout.method.replace('_', ' ')}.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex gap-3">
                        <Button variant="outline" onClick={() => setProcessDialogOpen(false)} className="flex-1">
                            Cancel
                        </Button>
                        <Button onClick={confirmProcessPayout} disabled={processing} className="flex-1">
                            {processing ? 'Processing...' : '✓ Confirm & Mark as Paid'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}