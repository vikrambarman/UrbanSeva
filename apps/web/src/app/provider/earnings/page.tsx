"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
    IndianRupee, Wallet, ArrowRight, Banknote, 
    CreditCard, Clock, CheckCircle2, AlertCircle, Zap, RefreshCw
} from "lucide-react"
import { toast } from "sonner"
import { apiFetch } from "@/lib/api-client"
import Link from "next/link"

export default function ProviderEarningsPage() {
    const [walletData, setWalletData] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    // Payout modal
    const [payoutModal, setPayoutModal] = useState(false)
    const [payoutAmount, setPayoutAmount] = useState('')
    const [payoutMethod, setPayoutMethod] = useState('BANK_TRANSFER')
    const [bankDetails, setBankDetails] = useState('')
    const [upiId, setUpiId] = useState('')
    const [payoutNotes, setPayoutNotes] = useState('')
    const [requesting, setRequesting] = useState(false)

    const fetchWallet = async () => {
        setLoading(true)
        try {
            const res = await apiFetch('/api/provider/wallet', { cache: 'no-store' })
            const data = await res.json()

            if (data.success) setWalletData(data.data)
            else toast.error(data.error)
        } catch (error) {
            console.error("Wallet fetch error:", error)
            toast.error("Failed to fetch wallet")
        } finally { setLoading(false) }
    }

    useEffect(() => { fetchWallet() }, [])

    const handlePayoutRequest = async () => {
        const amount = parseFloat(payoutAmount)
        if (!amount || amount <= 0) {
            toast.error('Please enter valid amount')
            return
        }

        if (amount > (walletData?.walletBalance || 0)) {
            toast.error('Amount exceeds wallet balance')
            return
        }

        if (payoutMethod === 'BANK_TRANSFER' && !bankDetails.trim()) {
            toast.error('Please enter bank account details')
            return
        }

        if (payoutMethod === 'UPI' && !upiId.trim()) {
            toast.error('Please enter UPI ID')
            return
        }

        setRequesting(true)
        try {
            const res = await apiFetch('/api/provider/payouts', {
                method: 'POST',
                body: JSON.stringify({
                    amount,
                    method: payoutMethod,
                    bankDetails: payoutMethod === 'BANK_TRANSFER' ? bankDetails : null,
                    upiId: payoutMethod === 'UPI' ? upiId : null,
                    notes: payoutNotes || null
                })
            })
            const data = await res.json()

            if (data.success) {
                toast.success('Payout request submitted!')
                setPayoutModal(false)
                resetPayoutForm()
                fetchWallet()
            } else toast.error(data.error)
        } catch (error) {
            console.error("Payout request error:", error)
            toast.error("Failed to request payout")
        } finally {
            setRequesting(false)
        }
    }

    const resetPayoutForm = () => {
        setPayoutAmount('')
        setPayoutMethod('BANK_TRANSFER')
        setBankDetails('')
        setUpiId('')
        setPayoutNotes('')
    }

    if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>

    const transactions = walletData?.transactions || []

    const getTxnIcon = (type: string) => {
        switch(type) {
            case 'EARNING_CREDIT': return <Zap className="h-5 w-5 text-green-600" />
            case 'PAYOUT_HOLD': return <Clock className="h-5 w-5 text-amber-600" />
            case 'PAYOUT_COMPLETED': return <CheckCircle2 className="h-5 w-5 text-blue-600" />
            case 'PAYOUT_REFUND': return <ArrowRight className="h-5 w-5 text-purple-600" />
            default: return <IndianRupee className="h-5 w-5 text-gray-600" />
        }
    }

    const getTxnColor = (type: string) => {
        switch(type) {
            case 'EARNING_CREDIT': case 'PAYOUT_REFUND': return 'text-green-600'
            case 'PAYOUT_HOLD': return 'text-amber-600'
            case 'PAYOUT_COMPLETED': return 'text-red-600'
            default: return 'text-gray-600'
        }
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">My Wallet & Earnings</h1>
                    <p className="text-muted-foreground">Track your income, wallet balance, and request payouts.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={fetchWallet} disabled={loading}>
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                    <Button onClick={() => setPayoutModal(true)} disabled={!walletData?.walletBalance}>
                        <Wallet className="mr-2 h-4 w-4" />
                        Request Payout
                    </Button>
                    <Button asChild variant="outline">
                        <Link href="/provider/earnings/payouts">Payout History <ArrowRight className="ml-2 h-4 w-4" /></Link>
                    </Button>
                </div>
            </div>

            {/* Wallet Balance Card */}
            <Card className="bg-gradient-to-br from-primary to-orange-600 text-white border-0">
                <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-2">
                        <Wallet className="h-5 w-5 opacity-80" />
                        <p className="text-sm font-medium opacity-90">Available Wallet Balance</p>
                    </div>
                    <p className="text-4xl font-bold">₹{(walletData?.walletBalance || 0).toLocaleString()}</p>
                    <p className="text-xs opacity-80 mt-2">You can request a payout anytime.</p>
                </CardContent>
            </Card>

            {/* Wallet Transactions */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                    {transactions.length === 0 ? (
                        <div className="text-center py-8">
                            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground">No transactions yet.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {transactions.map((txn: any) => (
                                <div key={txn.id} className="flex justify-between items-center p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full flex items-center justify-center bg-muted">
                                            {getTxnIcon(txn.type)}
                                        </div>
                                        <div>
                                            <p className="font-medium">{txn.description}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {new Date(txn.createdAt).toLocaleString('en-IN')} 
                                                {txn.booking && ` • Booking #${txn.booking.bookingNumber}`}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`font-bold ${getTxnColor(txn.type)}`}>
                                            {['EARNING_CREDIT', 'PAYOUT_REFUND'].includes(txn.type) ? '+' : '-'}₹{txn.amount.toLocaleString()}
                                        </p>
                                        <p className="text-xs text-muted-foreground">Bal: ₹{txn.balanceAfter.toLocaleString()}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Payout Request Modal */}
            <Dialog open={payoutModal} onOpenChange={(open) => { setPayoutModal(open); if(!open) resetPayoutForm() }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Request Payout</DialogTitle>
                        <DialogDescription>
                            Withdraw your earnings. Available: ₹{(walletData?.walletBalance || 0).toLocaleString()}
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
                                max={walletData?.walletBalance || 0}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Payout Method *</Label>
                            <Select value={payoutMethod} onValueChange={setPayoutMethod}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="BANK_TRANSFER">
                                        <div className="flex items-center gap-2"><CreditCard className="h-4 w-4" /> Bank Transfer</div>
                                    </SelectItem>
                                    <SelectItem value="UPI">
                                        <div className="flex items-center gap-2"><Banknote className="h-4 w-4" /> UPI</div>
                                    </SelectItem>
                                    <SelectItem value="CASH">
                                        <div className="flex items-center gap-2"><Banknote className="h-4 w-4" /> Cash (Offline)</div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {payoutMethod === 'BANK_TRANSFER' && (
                            <div className="space-y-2">
                                <Label>Bank Account Details *</Label>
                                <Input value={bankDetails} onChange={(e) => setBankDetails(e.target.value)} placeholder="Account No, IFSC, Bank Name" />
                            </div>
                        )}

                        {payoutMethod === 'UPI' && (
                            <div className="space-y-2">
                                <Label>UPI ID *</Label>
                                <Input value={upiId} onChange={(e) => setUpiId(e.target.value)} placeholder="name@upi" />
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label>Notes (Optional)</Label>
                            <Input value={payoutNotes} onChange={(e) => setPayoutNotes(e.target.value)} placeholder="Any specific instructions..." />
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="outline" onClick={() => setPayoutModal(false)} className="flex-1">Cancel</Button>
                        <Button onClick={handlePayoutRequest} disabled={requesting || !payoutAmount} className="flex-1">
                            {requesting ? 'Requesting...' : 'Submit Request'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}