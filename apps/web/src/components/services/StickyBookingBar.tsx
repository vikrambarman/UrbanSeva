'use client'

import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

// ✅ ENHANCED — Premium sticky booking bar
// Changes:
// 1. 🔴 FIX: `container mx-auto` → `max-w-[1400px] mx-auto px-4` (width consistency)
// 2. 🔴 FIX: "→" character → ArrowRight icon
// 3. 🟡 Added backdrop-blur for glassmorphism effect
// 4. 🟡 Added safe-area-inset for iPhone notch etc.
// 5. 🟡 Better visual hierarchy with border-top gradient

interface Service {
  id: string
  name: string
  basePrice: number
  priceType: 'FIXED' | 'STARTING_AT' | 'PER_SQFT' | 'CUSTOM_QUOTE'
}

interface StickyBookingBarProps {
  service: Service
  serviceUrl: string
}

export function StickyBookingBar({ service, serviceUrl }: StickyBookingBarProps) {
  const getPriceDisplay = () => {
    switch (service.priceType) {
      case 'FIXED':
        return `₹${service.basePrice}`
      case 'STARTING_AT':
        return `Starts ₹${service.basePrice}`
      case 'PER_SQFT':
        return `₹${service.basePrice}/sqft`
      case 'CUSTOM_QUOTE':
        return 'Get Quote'
      default:
        return `₹${service.basePrice}`
    }
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] md:hidden z-50">
      {/* ✅ FIX: container mx-auto → max-w-[1400px] */}
      <div className="max-w-[1400px] mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div>
          <div className="text-xs text-muted-foreground">Starting from</div>
          <div className="text-lg font-bold text-primary">
            {getPriceDisplay()}
          </div>
        </div>
        <Link href={serviceUrl}>
          {/* ✅ FIX: "→" character → ArrowRight icon */}
          <Button size="lg" className="bg-primary hover:bg-primary/90 px-6 flex items-center gap-2">
            <span>Book Now</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>
      {/* ✅ Safe area for iPhone notch */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </div>
  )
}