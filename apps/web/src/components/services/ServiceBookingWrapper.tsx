/**
 * WHAT: Wrapper component to connect PricingSelector + AddToCartButton
 * WHY: PricingSelector selects tier, but AddToCartButton doesn't receive that data
 * NOTE: Auto-select first pricing tier on mount
 */

'use client'

import { useState, useEffect } from 'react'  // ✅ Added useEffect
import { PricingSelector } from './PricingSelector'
import { AddToCartButton } from './AddToCartButton'
import { AddOnSelector } from './AddOnSelector'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'

interface ServiceBookingWrapperProps {
  service: {
    id: string
    name: string
    slug: string
    image: string | null
    basePrice: number
    priceType: 'FIXED' | 'STARTING_AT' | 'PER_SQFT' | 'CUSTOM_QUOTE'
    pricingTiers: Array<{
      id: string
      label: string
      price: number
      duration?: string | null
    }>
    addOns: Array<{
      id: string
      name: string
      price: number
      description?: string | null
    }>
    subCategory: {
      slug: string
      category: {
        slug: string
      }
    }
  }
}

export function ServiceBookingWrapper({ service }: ServiceBookingWrapperProps) {
  const [selectedPricing, setSelectedPricing] = useState<{
    label: string
    price: number
  } | null>(null)

  const [selectedAddOns, setSelectedAddOns] = useState<Array<{
    id: string
    name: string
    price: number
  }>>([])

  const handlePriceChange = (label: string, price: number) => {
    setSelectedPricing({ label, price })
  }

  const handleAddOnChange = (addOns: Array<{ id: string; name: string; price: number }>) => {
    setSelectedAddOns(addOns)
  }

  const validateSelection = () => {
    if (!selectedPricing || selectedPricing.price <= 0) {
      toast.error('Please select a package first')
      return false
    }
    return true
  }

  // ✅ FIX: Auto-select first pricing tier on component mount
  useEffect(() => {
    if (service.pricingTiers && service.pricingTiers.length > 0 && !selectedPricing) {
      const firstTier = service.pricingTiers[0]
      setSelectedPricing({
        label: firstTier.label,
        price: firstTier.price
      })
    }
  }, [service.pricingTiers])  // Only run when pricingTiers change

  return (
    <div className="space-y-5">
      <PricingSelector 
        service={service} 
        onPriceChange={handlePriceChange}
        defaultSelectedId={service.pricingTiers[0]?.id}  // ✅ Pass default to selector
      />

      {service.addOns.length > 0 && (
        <>
          <Separator />
          <div>
            <h4 className="font-medium mb-3">Add-ons</h4>
            <AddOnSelector 
              addOns={service.addOns}
              onAddOnChange={handleAddOnChange}
            />
          </div>
        </>
      )}

      <Separator />

      <AddToCartButton 
        service={service}
        selectedPricing={selectedPricing}
        selectedAddOns={selectedAddOns}
        onValidate={validateSelection}
      />
    </div>
  )
}