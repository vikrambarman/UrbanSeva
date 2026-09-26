"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, CheckCircle } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { apiFetch } from "@/lib/api-client"

export default function AdminRefundsPage() {
    const [refunds, setRefunds] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    const fetchRefunds = async () => {
        setLoading(true)
        try {
            const res = await apiFetch('/api/admin/finance/refunds')
            const data = await res.json()
            if (data.success) setRefunds(data.data)
            else toast.error(data.error)
        } catch { toast.error("Failed to fetch refunds") } 
        finally { setLoading(false) }
    }

    useEffect(() => { fetchRefunds() }, [])

    const handleProcessRefund = async (bookingId: string) => {
        if (!confirm("Process this refund? This will mark the payment as fully refunded.")) return
        try {
            const res = await apiFetch('/api/admin/finance/refunds', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bookingId })
            })
            const data = await res.json()
            if (data.success) { toast.success("Refund processed successfully"); fetchRefunds() }
            else toast.error(data.error)
        } catch { toast.error("Failed to process refund") }
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
                        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Booking #</TableHead>
                                        <TableHead>Customer</TableHead>
                                        <TableHead>Service</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {refunds.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
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
                                                <TableCell className="font-semibold text-destructive">₹{refund.totalAmount}</TableCell>
                                                <TableCell>
                                                    <Badge variant={refund.paymentStatus === 'REFUNDED' ? 'default' : 'secondary'}>
                                                        {refund.paymentStatus.replace('_', ' ')}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {refund.paymentStatus === 'REFUND_INITIATED' && (
                                                        <Button size="sm" onClick={() => handleProcessRefund(refund.id)}>
                                                            <CheckCircle className="h-4 w-4 mr-1" /> Process Refund
                                                        </Button>
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
        </div>
    )
}