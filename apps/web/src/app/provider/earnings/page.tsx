/**
 * WHAT: Provider earnings page with POD vs Online tracking
 * WHY: 
 * - POD earnings alag dikhenge (pending verification)
 * - Online earnings auto-settled dikhenge
 * - Provider ko clear picture milegi ki kitna available hai
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
    IndianRupee, TrendingUp, Wallet, ArrowRight, Banknote, 
    CreditCard, Clock, CheckCircle2, AlertCircle, Zap
} from "lucide-react"
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

    const onlineEarnings = data?.earnings?.filter((e: any) => e.paymentMethod === 'ONLINE') || []
    const podEarnings = data?.earnings?.filter((e: any) => e.paymentMethod === 'POD') || []

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

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
                        <CardTitle className="text-sm font-medium">Online Earnings</CardTitle>
                        <Zap className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">₹{(data?.stats?.onlineNet || 0).toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">Auto-settled</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">POD Earnings</CardTitle>
                        <Clock className="h-4 w-4 text-amber-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-600">₹{(data?.stats?.podNet || 0).toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">Payment on Delivery</p>
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

            {/* Commission Info */}
            <Card className="bg-muted/50">
                <CardContent className="flex items-center gap-4 p-4">
                    <TrendingUp className="h-5 w-5 text-orange-600" />
                    <div>
                        <p className="text-sm font-medium">Total Commission Deducted</p>
                        <p className="text-xs text-muted-foreground">
                            ₹{(data?.stats?.totalCommission || 0).toLocaleString()} platform fee on gross ₹{(data?.stats?.totalGross || 0).toLocaleString()}
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Tabs for Online vs POD */}
            <Tabs defaultValue="all">
                <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
                    <TabsTrigger value="all">All Earnings</TabsTrigger>
                    <TabsTrigger value="online">Online</TabsTrigger>
                    <TabsTrigger value="pod">POD</TabsTrigger>
                </TabsList>

                <TabsContent value="all">
                    <Card>
                        <CardHeader><CardTitle>Recent Earnings</CardTitle></CardHeader>
                        <CardContent>
                            <EarningsList earnings={data?.earnings || []} />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="online">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Zap className="h-5 w-5 text-blue-600" />
                                Online Payments
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <EarningsList earnings={onlineEarnings} emptyMessage="No online earnings yet." />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="pod">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Clock className="h-5 w-5 text-amber-600" />
                                POD (Payment on Delivery)
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <EarningsList earnings={podEarnings} emptyMessage="No POD earnings yet." />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

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

// Earnings List Component
function EarningsList({ earnings, emptyMessage }: { earnings: any[]; emptyMessage?: string }) {
    if (earnings.length === 0) {
        return (
            <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">{emptyMessage || "No earnings yet."}</p>
            </div>
        )
    }

    const getStatusBadge = (status: string, paymentMethod: string) => {
        if (status === 'PAID') return <Badge className="bg-green-100 text-green-700">Paid</Badge>
        if (status === 'SETTLED') return <Badge className="bg-blue-100 text-blue-700">Settled</Badge>
        if (status === 'PENDING_VERIFICATION') return <Badge className="bg-amber-100 text-amber-700">Pending Verification</Badge>
        if (status === 'PAYOUT_INITIATED') return <Badge className="bg-purple-100 text-purple-700">Payout Initiated</Badge>
        return <Badge variant="secondary">{status}</Badge>
    }

    return (
        <div className="space-y-3">
            {earnings.map((e: any) => (
                <div key={e.id} className="flex justify-between items-center p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                            e.paymentMethod === 'POD' ? 'bg-amber-100' : 'bg-blue-100'
                        }`}>
                            {e.paymentMethod === 'POD' ? (
                                <Clock className="h-5 w-5 text-amber-600" />
                            ) : (
                                <Zap className="h-5 w-5 text-blue-600" />
                            )}
                        </div>
                        <div>
                            <p className="font-medium">
                                Gross: ₹{e.gross.toLocaleString()} → Net: ₹{e.net.toLocaleString()}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Commission: ₹{e.commission.toLocaleString()} • {new Date(e.createdAt).toLocaleDateString('en-IN')}
                                {e.paymentMethod === 'POD' && ' • POD'}
                            </p>
                        </div>
                    </div>
                    {getStatusBadge(e.status, e.paymentMethod)}
                </div>
            ))}
        </div>
    )
}