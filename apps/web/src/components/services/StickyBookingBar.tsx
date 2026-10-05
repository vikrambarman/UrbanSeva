// components/services/StickyBookingBar.tsx

'use client'

// CHANGE: 
// 1. Service interface expand kiya — slug, image, subCategory add kiye
//    (BookNowButton ko ye fields chahiye)
// 2. <Link href={serviceUrl}> → <BookNowButton> replace kiya
//    (Pehle /booking/slug route tha jo exist nahi karta tha)
// 3. serviceUrl prop hata diya — ab zaroorat nahi hai

import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
// CHANGE: BookNowButton import kiya — direct checkout pe le jayega
import { BookNowButton } from '@/components/services/BookNowButton'

// CHANGE: Interface expand kiya — BookNowButton ko slug, image, subCategory chahiye
interface Service {
  id: string
  name: string
  slug: string
  image: string | null
  basePrice: number
  priceType: 'FIXED' | 'STARTING_AT' | 'PER_SQFT' | 'CUSTOM_QUOTE'
  subCategory: {
    slug: string
    category: {
      slug: string
    }
  }
}

// CHANGE: serviceUrl prop hata diya — ab BookNowButton handle karta hai
interface StickyBookingBarProps {
  service: Service
}

export function StickyBookingBar({ service }: StickyBookingBarProps) {
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
      <div className="max-w-[1400px] mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div>
          <div className="text-xs text-muted-foreground">Starting from</div>
          <div className="text-lg font-bold text-primary">
            {getPriceDisplay()}
          </div>
        </div>
        {/* CHANGE: <Link> hata ke <BookNowButton> lagaya — direct checkout pe jayega */}
        <BookNowButton service={service} />
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </div>
  )
}