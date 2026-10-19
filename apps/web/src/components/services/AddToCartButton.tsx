/**
 * WHAT: Add to Cart Button with Book Now Button
 * WHY: Customer ko do options - Add to Cart ya Direct Book
 * NOTE: Book Now button login redirect karega aur direct booking flow start karega
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ShoppingCart, Check, ArrowRight, Loader2 } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
import { useAuthStore } from '@/store/authStore'
import { toast } from 'sonner'

interface AddToCartButtonProps {
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
  selectedPricing: {
    label: string
    price: number
  } | null
  selectedAddOns: Array<{
    id: string
    name: string
    price: number
  }>
  onValidate: () => boolean
}

export function AddToCartButton({ 
  service, 
  selectedPricing, 
  selectedAddOns,
  onValidate 
}: AddToCartButtonProps) {
  const router = useRouter()
  const { addItem, clearCart } = useCartStore()
  const { isAuthenticated } = useAuthStore()
  
  const [added, setAdded] = useState(false)
  const [bookingLoading, setBookingLoading] = useState(false)

  // ═══════════════════════════════
  // Add to Cart Handler
  // ═══════════════════════════════
  const handleAddToCart = () => {
    if (!onValidate()) {
      return
    }

    const finalPrice = selectedPricing?.price || service.basePrice
    const finalLabel = selectedPricing?.label || 'Standard'

    if (finalPrice <= 0) {
      toast.error('Invalid price selected')
      return
    }

    addItem({
      serviceId: service.id,
      serviceName: service.name,
      serviceSlug: service.slug,
      serviceImage: service.image,
      categorySlug: service.subCategory.category.slug,
      subCategorySlug: service.subCategory.slug,
      selectedPricingLabel: finalLabel,
      selectedPrice: finalPrice,
      addOns: selectedAddOns || [],
      quantity: 1,
    })

    setAdded(true)
    toast.success('Added to cart!')

    setTimeout(() => setAdded(false), 2000)
  }

  // ══════════════════════════════
  // Book Now Handler (Direct Booking)
  // ═══════════════════════════════
  const handleBookNow = () => {
    // Step 1: Validate pricing selection
    if (!onValidate()) {
      return
    }

    const finalPrice = selectedPricing?.price || service.basePrice
    const finalLabel = selectedPricing?.label || 'Standard'

    if (finalPrice <= 0) {
      toast.error('Invalid price selected')
      return
    }

    // Step 2: Login check
    if (!isAuthenticated) {
      toast.info('Please login to continue booking')
      // Redirect to login with return URL
      const returnUrl = encodeURIComponent(`/booking/${service.id}/schedule`)
      router.push(`/login?redirect=${returnUrl}`)
      return
    }

    setBookingLoading(true)

    try {
      // Step 3: Clear cart — sirf ye ek service rakho
      clearCart()

      // Step 4: Service ko cart mein add karo with selected pricing
      addItem({
        serviceId: service.id,
        serviceName: service.name,
        serviceSlug: service.slug,
        serviceImage: service.image,
        categorySlug: service.subCategory.category.slug,
        subCategorySlug: service.subCategory.slug,
        selectedPricingLabel: finalLabel,
        selectedPrice: finalPrice,
        addOns: selectedAddOns || [],
        quantity: 1,
      })

      toast.success(`${service.name} ready for booking`)

      // Step 5: Schedule page pe redirect karo (multi-step flow)
      router.push(`/booking/${service.id}/schedule`)
    } catch (error) {
      console.error('Book Now error:', error)
      toast.error('Something went wrong')
    } finally {
      setBookingLoading(false)
    }
  }

  const isDisabled = !selectedPricing || selectedPricing.price <= 0

  return (
    <div className="space-y-3">
      {isDisabled && (
        <p className="text-xs text-amber-600 text-center">
          ⚠️ Please select a package above
        </p>
      )}
      
      {/* Add to Cart Button */}
      <Button
        onClick={handleAddToCart}
        disabled={isDisabled || added}
        className={`w-full font-semibold py-3 px-6 rounded-xl transition-all shadow-sm ${
          added
            ? 'bg-green-600 hover:bg-green-700 text-white'
            : isDisabled
            ? 'bg-muted text-muted-foreground cursor-not-allowed'
            : 'bg-primary hover:bg-primary/90 text-white'
        }`}
      >
        {added ? (
          <>
            <Check className="w-5 h-5 mr-2" />
            Added to Cart
          </>
        ) : (
          <>
            <ShoppingCart className="w-5 h-5 mr-2" />
            Add to Cart
          </>
        )}
      </Button>

      {/* Book Now Button */}
      <Button
        onClick={handleBookNow}
        disabled={isDisabled || bookingLoading}
        variant="outline"
        className="w-full font-semibold py-3 px-6 rounded-xl border-2 border-primary text-primary hover:bg-primary hover:text-white transition-all flex items-center justify-center gap-2"
      >
        {bookingLoading ? (
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

      {/* Info Text */}
      <p className="text-xs text-center text-muted-foreground">
        {isAuthenticated 
          ? 'Book Now will clear your cart and start immediate booking' 
          : 'Login required for direct booking'}
      </p>
    </div>
  )
}