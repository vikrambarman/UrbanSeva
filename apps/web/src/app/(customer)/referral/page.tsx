import { Metadata } from 'next'
import { Gift, Copy, Users } from 'lucide-react'

// ✅ NEW FILE — Placeholder
// /referral route pehle 404 de raha tha. Minimal placeholder jab tak
// actual referral page develop na ho.
export const metadata: Metadata = {
  title: 'Refer & Earn',
}

export default function ReferralPage() {
  return (
    <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-8 md:py-12">
      <h1 className="text-2xl font-semibold text-gray-900">Refer & Earn</h1>
      <p className="mt-2 text-sm text-gray-500">
        Invite friends and earn rewards when they book their first service.
      </p>

      {/* Referral card placeholder */}
      <div className="mt-8 rounded-xl border border-gray-200 bg-white p-6 md:p-8">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-teal-50">
            <Gift className="h-6 w-6 text-teal-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900">Your referral code</p>
            <p className="text-sm text-gray-500">Share this code with friends to earn rewards.</p>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3 rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-3">
          <code className="flex-1 text-sm font-medium text-gray-600">
            — — — — — —
          </code>
          <button
            type="button"
            disabled
            className="flex items-center gap-1.5 rounded-md bg-gray-200 px-3 py-1.5 text-xs font-medium text-gray-400 cursor-not-allowed"
          >
            <Copy className="h-3.5 w-3.5" />
            Copy
          </button>
        </div>

        <div className="mt-6 flex items-center gap-3 text-sm text-gray-400">
          <Users className="h-4 w-4" />
          <span>Referral system is under construction.</span>
        </div>
      </div>
    </div>
  )
}