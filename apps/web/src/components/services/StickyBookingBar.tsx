'use client'

import { Button } from '@/components/ui/button'
import Link from 'next/link'

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
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t shadow-lg md:hidden z-50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div>
          <div className="text-xs text-muted-foreground">Price</div>
          <div className="text-lg font-bold text-primary">
            {getPriceDisplay()}
          </div>
        </div>
        <Link href={serviceUrl}>
          <Button size="lg" className="bg-primary hover:bg-primary/90 px-8">
            Book Now →
          </Button>
        </Link>
      </div>
    </div>
  )
}