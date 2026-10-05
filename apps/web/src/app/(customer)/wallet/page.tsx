import { Metadata } from 'next'
import { Wallet, ArrowUpRight, ArrowDownRight } from 'lucide-react'

// ✅ NEW FILE — Placeholder
// /wallet route pehle 404 de raha tha. Minimal placeholder jab tak
// actual wallet page develop na ho.
export const metadata: Metadata = {
  title: 'My Wallet',
}

export default function WalletPage() {
  return (
    <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-8 md:py-12">
      <h1 className="text-2xl font-semibold text-gray-900">My Wallet</h1>
      <p className="mt-2 text-sm text-gray-500">
        View your balance, transactions, and wallet history.
      </p>

      {/* Balance card placeholder */}
      <div className="mt-8 rounded-xl bg-gradient-to-br from-teal-600 to-teal-700 p-6 text-white md:p-8">
        <div className="flex items-center gap-3">
          <Wallet className="h-5 w-5 opacity-80" />
          <span className="text-sm font-medium opacity-80">Available Balance</span>
        </div>
        <p className="mt-3 text-3xl font-bold">₹0.00</p>
        <p className="mt-1 text-xs opacity-60">Wallet functionality is under construction.</p>
      </div>

      {/* Transaction list placeholder */}
      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-sm font-medium text-gray-700">Recent Transactions</h2>
        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-3 text-sm text-gray-400">
            <ArrowDownRight className="h-4 w-4" />
            <span>No transactions yet</span>
          </div>
        </div>
      </div>
    </div>
  )
}