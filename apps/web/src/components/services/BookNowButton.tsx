/**
 * WHAT: Book Now button with login check
 * WHY: Production flow - customer must login before booking
 * NOTE: If not logged in, redirects to login with return URL
 */

'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowRight, Loader2 } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
import { useAuthStore } from '@/store/authStore'
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
  const { isAuthenticated } = useAuthStore()
  const [loading, setLoading] = useState(false)

  const handleBookNow = () => {
    // Step 1: Login check
    if (!isAuthenticated) {
      toast.info('Please login to continue booking')
      // Redirect to login with return URL
      const returnUrl = encodeURIComponent(`/booking/${service.id}/schedule`)
      router.push(`/login?redirect=${returnUrl}`)
      return
    }

    setLoading(true)

    try {
      // Step 2: Cart clear karo — sirf ye ek service rakho
      clearCart()

      // Step 3: Service ko cart mein add karo
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

      // Step 4: Schedule page pe redirect karo (multi-step flow)
      router.push(`/booking/${service.id}/schedule`)
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