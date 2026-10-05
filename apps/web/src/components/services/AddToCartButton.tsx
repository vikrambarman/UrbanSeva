'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ShoppingCart, Check } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
import { toast } from 'sonner'

// ✅ MINIMAL ENHANCEMENT — Already good, minor improvements
// Changes:
// 1. Better button styling with shadow
// 2. Improved transition effects

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
}

export function AddToCartButton({ service }: AddToCartButtonProps) {
  const { addItem } = useCartStore()
  const [added, setAdded] = useState(false)

  const handleAddToCart = () => {
    const selectedPrice = service.basePrice
    const selectedLabel = service.priceType === 'FIXED' ? 'Standard' : 'Starting'

    addItem({
      serviceId: service.id,
      serviceName: service.name,
      serviceSlug: service.slug,
      serviceImage: service.image,
      categorySlug: service.subCategory.category.slug,
      subCategorySlug: service.subCategory.slug,
      selectedPricingLabel: selectedLabel,
      selectedPrice: selectedPrice,
      addOns: [],
      quantity: 1,
    })

    setAdded(true)
    toast.success('Added to cart!')

    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <Button
      onClick={handleAddToCart}
      className={`w-full font-semibold py-3 px-6 rounded-xl transition-all shadow-sm ${
        added
          ? 'bg-green-600 hover:bg-green-700 text-white'
          : 'bg-primary hover:bg-primary/90 text-white'
      }`}
      disabled={added}
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
  )
}