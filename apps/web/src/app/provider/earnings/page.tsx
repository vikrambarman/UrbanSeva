"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { IndianRupee, TrendingUp, Wallet, ArrowRight } from "lucide-react"
import { toast } from "sonner"
import { apiFetch } from "@/lib/api-client"
import Link from "next/link"

export default function ProviderEarningsPage() {
    const [data, setData] = useState<any>(null)
    const [period, setPeriod] = useState("all")
    const [loading, setLoading] = useState(true)

    const fetchEarnings = async () => {
        setLoading(true)
        try {
            // ✅ Response object milega
            const res = await apiFetch(`/api/provider/earnings?period=${period}`)
            // ✅ FIX: Parse karo
            const data = await res.json()

            if (data.success) setData(data.data)
            else toast.error(data.error)
        } catch (error) {
            console.error("Earnings fetch error:", error)
            toast.error("Failed to fetch earnings")
        }
        finally { setLoading(false) }
    }

    useEffect(() => { fetchEarnings() }, [period])

    if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">My Earnings</h1>
                    <p className="text-muted-foreground">Track your income and request payouts.</p>
                </div>
                <div className="flex gap-2">
                    <Select value={period} onValueChange={setPeriod}>
                        <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Time</SelectItem>
                            <SelectItem value="week">This Week</SelectItem>
                            <SelectItem value="month">This Month</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button asChild variant="outline">
                        <Link href="/provider/earnings/payouts">Payouts <ArrowRight className="ml-2 h-4 w-4" /></Link>
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
                        <IndianRupee className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹{(data?.stats?.totalNet || 0).toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">{data?.stats?.totalJobs || 0} jobs completed</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Gross Amount</CardTitle>
                        <TrendingUp className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹{(data?.stats?.totalGross || 0).toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">Before commission</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Commission</CardTitle>
                        <TrendingUp className="h-4 w-4 text-orange-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-600">₹{(data?.stats?.totalCommission || 0).toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">Platform fee</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Pending Payout</CardTitle>
                        <Wallet className="h-4 w-4 text-yellow-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹{(data?.stats?.pendingPayout || 0).toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">Available to withdraw</p>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Earnings Table */}
            <Card>
                <CardHeader><CardTitle>Recent Earnings</CardTitle></CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {data?.earnings?.length > 0 ? data.earnings.map((e: any) => (
                            <div key={e.id} className="flex justify-between items-center p-3 border rounded-md">
                                <div>
                                    <p className="font-medium">Gross: ₹{e.gross} → Net: ₹{e.net}</p>
                                    <p className="text-xs text-muted-foreground">Commission: ₹{e.commission} • {new Date(e.createdAt).toLocaleDateString()}</p>
                                </div>
                                <Badge variant={e.status === 'PAID' ? 'default' : 'secondary'}>{e.status}</Badge>
                            </div>
                        )) : (
                            <p className="text-center py-8 text-muted-foreground">No earnings yet.</p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}