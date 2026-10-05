// components/services/BookNowButton.tsx

'use client'

// CHANGE: NEW FILE — "Book Now" button jo single service ko cart mein add karke
// direct checkout pe redirect karta hai. Pehle ye <Link href="/booking/slug"> tha
// jo exist hi nahi karta tha — route missing tha.

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowRight, Loader2 } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
import { useState } from 'react'
import { toast } from 'sonner'

interface BookNowButtonProps {
  service: {
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
  className?: string
}

export function BookNowButton({ service, className = '' }: BookNowButtonProps) {
  const router = useRouter()
  const { clearCart, addItem } = useCartStore()
  const [loading, setLoading] = useState(false)

  const handleBookNow = () => {
    setLoading(true)

    try {
      // Step 1: Cart clear karo — sirf ye ek service rakho
      clearCart()

      // Step 2: Service ko cart mein add karo
      const selectedLabel = service.priceType === 'FIXED' ? 'Standard' : 'Starting'

      addItem({
        serviceId: service.id,
        serviceName: service.name,
        serviceSlug: service.slug,
        serviceImage: service.image,
        categorySlug: service.subCategory.category.slug,
        subCategorySlug: service.subCategory.slug,
        selectedPricingLabel: selectedLabel,
        selectedPrice: service.basePrice,
        addOns: [],
        quantity: 1,
      })

      toast.success(`${service.name} ready for booking`)

      // Step 3: Checkout pe redirect karo
      router.push('/booking/checkout')
    } catch (error) {
      console.error('Book Now error:', error)
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      onClick={handleBookNow}
      disabled={loading}
      className={`w-full font-semibold py-3 px-6 rounded-xl border-2 border-primary text-white hover:bg-primary hover:text-white transition-colors flex items-center justify-center gap-2 ${className}`}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Processing...
        </>
      ) : (
        <>
          Book Now
          <ArrowRight className="w-4 h-4" />
        </>
      )}
    </Button>
  )
}