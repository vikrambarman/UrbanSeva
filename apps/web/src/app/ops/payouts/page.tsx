// apps/web/src/app/ops/payouts/page.tsx
/**
 * WHAT: OPS Payout Management Page
 * WHY: OPS can approve/reject payout requests with transaction reference
 */

"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import {
    CreditCard, CheckCircle2, Clock, XCircle,
    AlertCircle, IndianRupee, Search, Filter
} from "lucide-react"
import { apiFetch } from "@/lib/api-client"
import { toast } from "sonner"

interface Payout {
    id: string
    amount: number
    method: string
    status: string
    reference: string | null
    notes: string | null
    createdAt: Date
    processedAt: Date | null
    provider: {
        user: {
            name: string
            phone: string
        }
    }
}

export default function OpsPayoutsPage() {
    const [payouts, setPayouts] = useState<Payout[]>([])
    const [loading, setLoading] = useState(true)
    const [statusFilter, setStatusFilter] = useState("ALL")
    const [searchQuery, setSearchQuery] = useState("")
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)

    // Approval modal
    const [selectedPayout, setSelectedPayout] = useState<Payout | null>(null)
    const [action, setAction] = useState<'approve' | 'reject'>('approve')
    const [transactionRef, setTransactionRef] = useState('')
    const [notes, setNotes] = useState('')
    const [processing, setProcessing] = useState(false)

    useEffect(() => {
        fetchPayouts()
    }, [statusFilter, page])

    const fetchPayouts = async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '20',
            })
            if (statusFilter !== 'ALL') params.set('status', statusFilter)

            const res = await apiFetch(`/api/ops/payouts?${params}`, { cache: 'no-store' })
            const data = await res.json()

            if (data.success) {
                setPayouts(data.data.payouts)
                setTotalPages(data.data.pagination.totalPages)
            }
        } catch (error) {
            console.error('Fetch payouts error:', error)
            toast.error('Failed to load payouts')
        } finally {
            setLoading(false)
        }
    }

    const handleProcessPayout = async () => {
        if (!selectedPayout) return
        if (action === 'approve' && !transactionRef.trim()) {
            toast.error('Transaction reference is required for approval')
            return
        }
        if (action === 'reject' && !notes.trim()) {
            toast.error('Rejection reason is required')
            return
        }

        setProcessing(true)
        try {
            const res = await apiFetch(`/api/ops/payouts/${selectedPayout.id}/approve`, {
                method: 'POST',
                body: JSON.stringify({
                    action: action.toUpperCase(), // 'APPROVE' or 'REJECT'
                    transactionId: action === 'approve' ? transactionRef : null,
                    rejectionReason: action === 'reject' ? notes : null,
                })
            })
            const data = await res.json()

            if (data.success) {
                toast.success(action === 'approve' ? 'Payout approved!' : 'Payout rejected')
                setSelectedPayout(null)
                setTransactionRef('')
                setNotes('')
                fetchPayouts()
            } else {
                toast.error(data.error)
            }
        } catch (error) {
            toast.error('Failed to process payout')
        } finally {
            setProcessing(false)
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'COMPLETED':
                return <Badge className="bg-green-100 text-green-700"><CheckCircle2 className="h-3 w-3 mr-1" />Completed</Badge>
            case 'PENDING':
                return <Badge className="bg-amber-100 text-amber-700"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
            case 'FAILED':
                return <Badge className="bg-red-100 text-red-700"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>
            case 'PROCESSING':
                return <Badge className="bg-blue-100 text-blue-700"><Clock className="h-3 w-3 mr-1" />Processing</Badge>
            default:
                return <Badge variant="secondary">{status}</Badge>
        }
    }

    const filteredPayouts = payouts.filter(p =>
        p.provider.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.provider.user.phone.includes(searchQuery)
    )

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <CreditCard className="h-6 w-6 text-primary" />
                        Payout Management
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Approve or reject provider payout requests
                    </p>
                </div>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by provider name or phone..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[180px]">
                                <Filter className="h-4 w-4 mr-2" />
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">All Status</SelectItem>
                                <SelectItem value="PENDING">Pending</SelectItem>
                                <SelectItem value="COMPLETED">Completed</SelectItem>
                                <SelectItem value="FAILED">Rejected</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Payouts List */}
            <Card>
                <CardHeader>
                    <CardTitle>Payout Requests</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="space-y-3">
                            {[...Array(5)].map((_, i) => (
                                <Skeleton key={i} className="h-20 rounded-lg" />
                            ))}
                        </div>
                    ) : filteredPayouts.length === 0 ? (
                        <div className="text-center py-12">
                            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground">No payout requests found</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredPayouts.map((payout) => (
                                <div key={payout.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className={`h-12 w-12 rounded-full flex items-center justify-center ${payout.status === 'COMPLETED' ? 'bg-green-100' :
                                                payout.status === 'FAILED' ? 'bg-red-100' : 'bg-amber-100'
                                            }`}>
                                            <IndianRupee className={`h-6 w-6 ${payout.status === 'COMPLETED' ? 'text-green-600' :
                                                    payout.status === 'FAILED' ? 'text-red-600' : 'text-amber-600'
                                                }`} />
                                        </div>
                                        <div>
                                            <p className="font-semibold">{payout.provider.user.name}</p>
                                            <p className="text-sm text-muted-foreground">{payout.provider.user.phone}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge variant="outline">{payout.method}</Badge>
                                                <span className="text-xs text-muted-foreground">
                                                    {new Date(payout.createdAt).toLocaleDateString('en-IN')}
                                                </span>
                                                {payout.reference && (
                                                    <span className="text-xs text-muted-foreground">
                                                        Ref: {payout.reference}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <p className="text-xl font-bold">₹{payout.amount.toLocaleString()}</p>
                                            {getStatusBadge(payout.status)}
                                        </div>
                                        {payout.status === 'PENDING' && (
                                            <Button
                                                size="sm"
                                                onClick={() => {
                                                    setSelectedPayout(payout)
                                                    setAction('approve')
                                                }}
                                            >
                                                Process
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={page === 1}
                        onClick={() => setPage(p => p - 1)}
                    >
                        Previous
                    </Button>
                    <span className="flex items-center px-4 text-sm text-muted-foreground">
                        Page {page} of {totalPages}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={page === totalPages}
                        onClick={() => setPage(p => p + 1)}
                    >
                        Next
                    </Button>
                </div>
            )}

            {/* Process Payout Modal */}
            {/* Process Payout Modal - Sirf Labels update hain */}
            <Dialog open={!!selectedPayout} onOpenChange={() => setSelectedPayout(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Process Payout Request</DialogTitle>
                        <DialogDescription>
                            Provider: {selectedPayout?.provider.user.name} ({selectedPayout?.provider.user.phone})
                            <br />
                            Amount: ₹{selectedPayout?.amount.toLocaleString()} via {selectedPayout?.method}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="flex gap-2">
                            <Button variant={action === 'approve' ? 'default' : 'outline'} onClick={() => setAction('approve')} className="flex-1">
                                <CheckCircle2 className="h-4 w-4 mr-2" /> Approve
                            </Button>
                            <Button variant={action === 'reject' ? 'destructive' : 'outline'} onClick={() => setAction('reject')} className="flex-1">
                                <XCircle className="h-4 w-4 mr-2" /> Reject
                            </Button>
                        </div>

                        {action === 'approve' && (
                            <div className="space-y-2">
                                <Label>Transaction ID / UTR *</Label>
                                <Input value={transactionRef} onChange={(e) => setTransactionRef(e.target.value)} placeholder="Enter transaction reference after payment" />
                            </div>
                        )}

                        {action === 'reject' && (
                            <div className="space-y-2">
                                <Label>Rejection Reason *</Label>
                                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Why is this payout being rejected?" rows={3} />
                            </div>
                        )}
                    </div>
                    <div className="flex gap-3">
                        <Button variant="outline" onClick={() => setSelectedPayout(null)} className="flex-1">Cancel</Button>
                        <Button onClick={handleProcessPayout} disabled={processing} variant={action === 'reject' ? 'destructive' : 'default'} className="flex-1">
                            {processing ? 'Processing...' : action === 'approve' ? 'Approve & Mark Paid' : 'Reject Request'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}