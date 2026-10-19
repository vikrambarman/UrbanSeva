"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, RefreshCw, Wallet } from "lucide-react"
import { toast } from "sonner"
import { apiFetch } from "@/lib/api-client"
import Link from "next/link"

export default function ProviderPayoutsPage() {
    const [payouts, setPayouts] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [requesting, setRequesting] = useState(false)

    const fetchPayouts = async () => {
        setLoading(true)
        try {
            const res = await apiFetch('/api/provider/earnings/payouts', {
                cache: 'no-store'  // ✅ Prevent caching
            })
            const data = await res.json()

            if (data.success) setPayouts(data.data)
            else toast.error(data.error)
        } catch (error) {
            console.error("Payouts fetch error:", error)
            toast.error("Failed to fetch payouts")
        }
        finally { setLoading(false) }
    }

    useEffect(() => { fetchPayouts() }, [])

    const handleRequestPayout = async () => {
        setRequesting(true)
        try {
            // ✅ FIX: Response object milega
            const res = await apiFetch('/api/provider/earnings/payouts', { method: 'POST' })
            // ✅ FIX: Parse karo
            const data = await res.json()

            if (data.success) {
                toast.success("Payout request submitted!")
                fetchPayouts()
            } else toast.error(data.error)
        } catch (error) {
            console.error("Payout request error:", error)
            toast.error("Failed to request payout")
        }
        finally { setRequesting(false) }
    }

    return (
        <div className="p-6 space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-4">
                <Button asChild variant="ghost" size="icon">
                    <Link href="/provider/earnings"><ArrowLeft className="h-4 w-4" /></Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Payout History</h1>
                    <p className="text-muted-foreground">Track your payout requests.</p>
                </div>
            </div>

            <div className="flex items-center justify-between">
                <CardHeader><CardTitle>Payout History</CardTitle></CardHeader>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchPayouts}
                    disabled={loading}
                >
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Request Payout</CardTitle>
                    <Button onClick={handleRequestPayout} disabled={requesting}>
                        <Wallet className="h-4 w-4 mr-2" /> {requesting ? 'Requesting...' : 'Request Payout'}
                    </Button>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">Minimum payout amount is ₹500. Payouts are processed within 2-3 business days.</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>Payout History</CardTitle></CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
                    ) : payouts.length === 0 ? (
                        <p className="text-center py-8 text-muted-foreground">No payouts yet.</p>
                    ) : (
                        <div className="space-y-3">
                            {payouts.map((p) => (
                                <div key={p.id} className="flex justify-between items-center p-3 border rounded-md">
                                    <div>
                                        <p className="font-medium">₹{p.amount.toLocaleString()} via {p.method}</p>
                                        <p className="text-xs text-muted-foreground">{new Date(p.createdAt).toLocaleDateString()}</p>
                                    </div>
                                    <Badge variant={p.status === 'COMPLETED' ? 'default' : p.status === 'FAILED' ? 'destructive' : 'secondary'}>
                                        {p.status}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}