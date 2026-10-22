"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, RefreshCw, Wallet, Clock, CheckCircle2, XCircle } from "lucide-react"
import { toast } from "sonner"
import { apiFetch } from "@/lib/api-client"
import Link from "next/link"

export default function ProviderPayoutsPage() {
    const [payouts, setPayouts] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)

    const fetchPayouts = async () => {
        setLoading(true)
        try {
            const res = await apiFetch(`/api/provider/payouts?page=${page}&limit=20`, { cache: 'no-store' })
            const data = await res.json()

            if (data.success) {
                setPayouts(data.data.payouts)
                setTotalPages(data.data.pagination.totalPages)
            } else toast.error(data.error)
        } catch (error) {
            console.error("Payouts fetch error:", error)
            toast.error("Failed to fetch payouts")
        } finally { setLoading(false) }
    }

    useEffect(() => { fetchPayouts() }, [page])

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'COMPLETED': return <Badge className="bg-green-100 text-green-700"><CheckCircle2 className="h-3 w-3 mr-1" />Completed</Badge>
            case 'PENDING': return <Badge className="bg-amber-100 text-amber-700"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
            case 'REJECTED': return <Badge className="bg-red-100 text-red-700"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>
            case 'PROCESSING': return <Badge className="bg-blue-100 text-blue-700"><Clock className="h-3 w-3 mr-1" />Processing</Badge>
            default: return <Badge variant="secondary">{status}</Badge>
        }
    }

    return (
        <div className="p-6 space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-4">
                <Button asChild variant="ghost" size="icon">
                    <Link href="/provider/earnings"><ArrowLeft className="h-4 w-4" /></Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Payout History</h1>
                    <p className="text-muted-foreground">Track your payout requests and status.</p>
                </div>
            </div>

            <div className="flex items-center justify-between">
                <CardHeader className="p-0"><CardTitle>All Payouts</CardTitle></CardHeader>
                <Button variant="outline" size="sm" onClick={fetchPayouts} disabled={loading}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh
                </Button>
            </div>

            <Card>
                <CardContent className="pt-6">
                    {loading ? (
                        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
                    ) : payouts.length === 0 ? (
                        <div className="text-center py-12">
                            <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground">No payout requests yet.</p>
                            <Button asChild className="mt-4"><Link href="/provider/earnings">Request Payout</Link></Button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {payouts.map((p) => (
                                <div key={p.id} className="flex justify-between items-center p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                                    <div>
                                        <p className="font-semibold text-lg">₹{p.amount.toLocaleString()}</p>
                                        <p className="text-sm text-muted-foreground">
                                            Via {p.method.replace('_', ' ')} • {new Date(p.createdAt).toLocaleDateString('en-IN')}
                                        </p>
                                        {p.transactionId && <p className="text-xs text-muted-foreground mt-1">Ref: {p.transactionId}</p>}
                                        {p.rejectionReason && <p className="text-xs text-red-600 mt-1">Reason: {p.rejectionReason}</p>}
                                    </div>
                                    {getStatusBadge(p.status)}
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {totalPages > 1 && (
                <div className="flex justify-center gap-2">
                    <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
                    <span className="flex items-center px-4 text-sm text-muted-foreground">Page {page} of {totalPages}</span>
                    <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
                </div>
            )}
        </div>
    )
}