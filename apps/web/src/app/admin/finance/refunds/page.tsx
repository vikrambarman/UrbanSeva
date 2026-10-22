"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ArrowLeft, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { apiFetch } from "@/lib/api-client"

export default function AdminRefundsPage() {
    const [refunds, setRefunds] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    
    // Modal state
    const [selectedRefund, setSelectedRefund] = useState<any>(null)
    const [action, setAction] = useState<'APPROVE' | 'REJECT'>('APPROVE')
    const [notes, setNotes] = useState('')
    const [processing, setProcessing] = useState(false)

    const fetchRefunds = async () => {
        setLoading(true)
        try {
            const res = await apiFetch('/api/admin/finance/refunds', { cache: 'no-store' })
            const data = await res.json()
            if (data.success) setRefunds(data.data)
            else toast.error(data.error)
        } catch { toast.error("Failed to fetch refunds") } 
        finally { setLoading(false) }
    }

    useEffect(() => { fetchRefunds() }, [])

    const openModal = (refund: any, actionType: 'APPROVE' | 'REJECT') => {
        setSelectedRefund(refund)
        setAction(actionType)
        setNotes('')
    }

    const handleProcessRefund = async () => {
        if (!selectedRefund) return

        if (action === 'REJECT' && !notes.trim()) {
            toast.error('Please provide a reason for rejection')
            return
        }

        setProcessing(true)
        try {
            const res = await apiFetch('/api/admin/finance/refunds', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    bookingId: selectedRefund.id,
                    action,
                    notes 
                })
            })
            const data = await res.json()
            
            if (data.success) { 
                toast.success(data.message)
                setSelectedRefund(null)
                setNotes('')
                fetchRefunds() 
            } else {
                toast.error(data.error)
            }
        } catch { 
            toast.error("Failed to process refund") 
        } finally { 
            setProcessing(false) 
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'REFUND_INITIATED':
                return <Badge className="bg-amber-100 text-amber-700"><Clock className="h-3 w-3 mr-1" />Pending Review</Badge>
            case 'REFUNDED':
                return <Badge className="bg-green-100 text-green-700"><CheckCircle className="h-3 w-3 mr-1" />Refunded</Badge>
            default:
                return <Badge variant="secondary">{status}</Badge>
        }
    }

    const extractRefundReason = (instructions: string | null) => {
        if (!instructions) return 'No reason provided'
        const match = instructions.match(/\[REFUND REQUEST\]:\s*(.+)/)
        return match ? match[1] : 'No reason provided'
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center gap-4">
                <Button asChild variant="ghost" size="icon">
                    <Link href="/admin/finance"><ArrowLeft className="h-4 w-4" /></Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Refund Management</h1>
                    <p className="text-muted-foreground">Review and process customer refund requests.</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Refund Requests</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Booking #</TableHead>
                                        <TableHead>Customer</TableHead>
                                        <TableHead>Service</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Reason</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {refunds.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                                No refund requests found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        refunds.map((refund) => (
                                            <TableRow key={refund.id}>
                                                <TableCell className="font-medium">{refund.bookingNumber}</TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span>{refund.user.name || "Guest"}</span>
                                                        <span className="text-xs text-muted-foreground">{refund.user.phone}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>{refund.service.name}</TableCell>
                                                <TableCell className="font-semibold text-destructive">
                                                    ₹{refund.totalAmount.toLocaleString()}
                                                </TableCell>
                                                <TableCell className="max-w-xs">
                                                    <p className="text-sm truncate" title={extractRefundReason(refund.specialInstructions)}>
                                                        {extractRefundReason(refund.specialInstructions)}
                                                    </p>
                                                </TableCell>
                                                <TableCell>{getStatusBadge(refund.paymentStatus)}</TableCell>
                                                <TableCell className="text-right">
                                                    {refund.paymentStatus === 'REFUND_INITIATED' && (
                                                        <div className="flex gap-2 justify-end">
                                                            <Button 
                                                                size="sm" 
                                                                variant="default"
                                                                onClick={() => openModal(refund, 'APPROVE')}
                                                            >
                                                                <CheckCircle className="h-4 w-4 mr-1" /> Approve
                                                            </Button>
                                                            <Button 
                                                                size="sm" 
                                                                variant="destructive"
                                                                onClick={() => openModal(refund, 'REJECT')}
                                                            >
                                                                <XCircle className="h-4 w-4 mr-1" /> Reject
                                                            </Button>
                                                        </div>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Process Refund Modal */}
            <Dialog open={!!selectedRefund} onOpenChange={() => setSelectedRefund(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {action === 'APPROVE' ? 'Approve Refund' : 'Reject Refund Request'}
                        </DialogTitle>
                        <DialogDescription>
                            Booking: {selectedRefund?.bookingNumber}
                            <br />
                            Customer: {selectedRefund?.user.name} ({selectedRefund?.user.phone})
                            <br />
                            Amount: ₹{selectedRefund?.totalAmount.toLocaleString()}
                            <br />
                            Reason: {selectedRefund ? extractRefundReason(selectedRefund.specialInstructions) : ''}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {action === 'APPROVE' && (
                            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                                <div className="flex items-start gap-3">
                                    <AlertCircle className="h-5 w-5 text-green-600 mt-0.5" />
                                    <div>
                                        <p className="font-medium text-green-900">Refund will be credited to customer wallet</p>
                                        <p className="text-sm text-green-700 mt-1">
                                            ₹{selectedRefund?.totalAmount.toLocaleString()} will be added to customer&apos;s wallet balance.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {action === 'REJECT' && (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                <div className="flex items-start gap-3">
                                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                                    <div>
                                        <p className="font-medium text-red-900">Refund request will be rejected</p>
                                        <p className="text-sm text-red-700 mt-1">
                                            Customer will be notified and booking status will revert to PAID.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label>
                                {action === 'APPROVE' ? 'Notes (Optional)' : 'Rejection Reason *'}
                            </Label>
                            <Textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder={action === 'APPROVE' ? 'Any additional notes...' : 'Please provide a reason for rejection...'}
                                rows={3}
                            />
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <Button variant="outline" onClick={() => setSelectedRefund(null)} className="flex-1">
                            Cancel
                        </Button>
                        <Button 
                            onClick={handleProcessRefund}
                            disabled={processing}
                            variant={action === 'REJECT' ? 'destructive' : 'default'}
                            className="flex-1"
                        >
                            {processing ? 'Processing...' : action === 'APPROVE' ? 'Approve & Credit Wallet' : 'Reject Request'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}