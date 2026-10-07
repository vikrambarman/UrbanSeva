/**
 * WHAT: Provider earnings with payout request
 * WHY: 
 * - Show settled vs pending earnings
 * - Provider can request payout
 * - Show payout history
 */

"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { IndianRupee, TrendingUp, Wallet, ArrowRight, Banknote, CreditCard } from "lucide-react"
import { toast } from "sonner"
import { apiFetch } from "@/lib/api-client"
import Link from "next/link"

export default function ProviderEarningsPage() {
    const [data, setData] = useState<any>(null)
    const [period, setPeriod] = useState("all")
    const [loading, setLoading] = useState(true)

    // Payout modal
    const [payoutModal, setPayoutModal] = useState(false)
    const [payoutAmount, setPayoutAmount] = useState('')
    const [payoutMethod, setPayoutMethod] = useState('BANK_TRANSFER')
    const [payoutDetails, setPayoutDetails] = useState({ reference: '' })
    const [requesting, setRequesting] = useState(false)

    const fetchEarnings = async () => {
        setLoading(true)
        try {
            const res = await apiFetch(`/api/provider/earnings?period=${period}`, { cache: 'no-store' })
            const data = await res.json()

            if (data.success) setData(data.data)
            else toast.error(data.error)
        } catch (error) {
            console.error("Earnings fetch error:", error)
            toast.error("Failed to fetch earnings")
        } finally { setLoading(false) }
    }

    useEffect(() => { fetchEarnings() }, [period])

    const handlePayoutRequest = async () => {
        if (!payoutAmount || parseFloat(payoutAmount) <= 0) {
            toast.error('Please enter valid amount')
            return
        }

        setRequesting(true)
        try {
            const res = await apiFetch('/api/provider/payouts/request', {
                method: 'POST',
                body: JSON.stringify({
                    amount: parseFloat(payoutAmount),
                    payoutMethod,
                    payoutDetails
                })
            })
            const data = await res.json()

            if (data.success) {
                toast.success('Payout request submitted!')
                setPayoutModal(false)
                setPayoutAmount('')
                fetchEarnings()
            } else toast.error(data.error)
        } catch (error) {
            console.error("Payout request error:", error)
            toast.error("Failed to request payout")
        } finally {
            setRequesting(false)
        }
    }

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
                    <Button onClick={() => setPayoutModal(true)} disabled={!data?.stats?.pendingPayout}>
                        <Wallet className="mr-2 h-4 w-4" />
                        Request Payout
                    </Button>
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
                        <CardTitle className="text-sm font-medium">Available Payout</CardTitle>
                        <Wallet className="h-4 w-4 text-yellow-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹{(data?.stats?.pendingPayout || 0).toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">Ready to withdraw</p>
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

            {/* Payout Request Modal */}
            <Dialog open={payoutModal} onOpenChange={setPayoutModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Request Payout</DialogTitle>
                        <DialogDescription>
                            Withdraw your earnings. Available: ₹{(data?.stats?.pendingPayout || 0).toLocaleString()}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Amount *</Label>
                            <Input
                                type="number"
                                value={payoutAmount}
                                onChange={(e) => setPayoutAmount(e.target.value)}
                                placeholder="Enter amount"
                                max={data?.stats?.pendingPayout || 0}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Payout Method *</Label>
                            <Select value={payoutMethod} onValueChange={setPayoutMethod}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="BANK_TRANSFER">
                                        <div className="flex items-center gap-2">
                                            <CreditCard className="h-4 w-4" />
                                            Bank Transfer
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="UPI">
                                        <div className="flex items-center gap-2">
                                            <Banknote className="h-4 w-4" />
                                            UPI / PhonePe / GPay
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="CASH">
                                        <div className="flex items-center gap-2">
                                            <Banknote className="h-4 w-4" />
                                            Cash (Offline)
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Reference (Optional)</Label>
                            <Input
                                value={payoutDetails.reference}
                                onChange={(e) => setPayoutDetails({ ...payoutDetails, reference: e.target.value })}
                                placeholder="Account number / UPI ID"
                            />
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="outline" onClick={() => setPayoutModal(false)} className="flex-1">
                            Cancel
                        </Button>
                        <Button 
                            onClick={handlePayoutRequest} 
                            disabled={requesting || !payoutAmount}
                            className="flex-1"
                        >
                            {requesting ? 'Requesting...' : 'Submit Request'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}