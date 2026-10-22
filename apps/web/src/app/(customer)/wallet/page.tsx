"use client"

import { useEffect, useState } from "react"
import { Wallet, ArrowDownRight, RefreshCw, Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { apiFetch } from "@/lib/api-client"
import { toast } from "sonner"

export default function WalletPage() {
    const [balance, setBalance] = useState<number>(0) // ✅ Explicit type + default 0
    const [loyaltyPoints, setLoyaltyPoints] = useState<number>(0)
    const [loyaltyTier, setLoyaltyTier] = useState<string>('BRONZE')
    const [transactions, setTransactions] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    const fetchWallet = async () => {
        setLoading(true)
        try {
            const res = await apiFetch('/api/customer/wallet', { cache: 'no-store' })
            const data = await res.json()
            
            if (data.success && data.data) {
                // ✅ FIX: API returns 'balance' not 'walletBalance'
                setBalance(data.data.balance ?? 0)
                setLoyaltyPoints(data.data.loyaltyPoints ?? 0)
                setLoyaltyTier(data.data.loyaltyTier ?? 'BRONZE')
                setTransactions(data.data.transactions || [])
            }
        } catch (error) {
            console.error("Wallet fetch error:", error)
            toast.error("Failed to fetch wallet balance")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchWallet() }, [])

    // ✅ Safe formatting function
    const formatCurrency = (amount: number | undefined | null) => {
        return (amount || 0).toLocaleString('en-IN')
    }

    return (
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-8 md:py-12">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-semibold text-gray-900">My Wallet</h1>
                <Button variant="outline" size="sm" onClick={fetchWallet} disabled={loading}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            {/* Balance card */}
            <div className="mt-8 rounded-xl bg-gradient-to-br from-teal-600 to-teal-700 p-6 text-white md:p-8">
                <div className="flex items-center gap-3">
                    <Wallet className="h-5 w-5 opacity-80" />
                    <span className="text-sm font-medium opacity-80">Available Balance</span>
                </div>
                {loading ? (
                    <Loader2 className="h-8 w-8 animate-spin mt-3" />
                ) : (
                    <p className="mt-3 text-3xl font-bold">₹{formatCurrency(balance)}</p>
                )}
                <p className="mt-1 text-xs opacity-60">Wallet balance is updated after successful refunds.</p>
                
                {/* Loyalty Info */}
                <div className="mt-4 pt-4 border-t border-white/20 flex items-center gap-4">
                    <div>
                        <p className="text-xs opacity-70">Loyalty Points</p>
                        <p className="text-lg font-semibold">{formatCurrency(loyaltyPoints)}</p>
                    </div>
                    <div>
                        <p className="text-xs opacity-70">Tier</p>
                        <p className="text-lg font-semibold">{loyaltyTier}</p>
                    </div>
                </div>
            </div>

            {/* Transaction list */}
            <Card className="mt-6">
                <CardContent className="p-6">
                    <h2 className="text-sm font-medium text-gray-700 mb-4">Recent Transactions</h2>
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                        </div>
                    ) : transactions.length === 0 ? (
                        <div className="flex items-center gap-3 text-sm text-gray-400 py-4 justify-center">
                            <ArrowDownRight className="h-4 w-4" />
                            <span>No transactions yet</span>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {transactions.map((txn: any) => (
                                <div key={txn.id} className="flex items-center justify-between p-3 border rounded-lg">
                                    <div>
                                        <p className="text-sm font-medium">{txn.type}</p>
                                        <p className="text-xs text-gray-500">{txn.description}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className={`text-sm font-semibold ${txn.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {txn.amount > 0 ? '+' : '-'}₹{formatCurrency(Math.abs(txn.amount))}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {new Date(txn.createdAt).toLocaleDateString('en-IN')}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}