'use client'

import { useState } from 'react'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface PricingTier {
  id: string
  label: string
  price: number
  duration?: string | null
}

interface Service {
  id: string
  name: string
  basePrice: number
  priceType: 'FIXED' | 'STARTING_AT' | 'PER_SQFT' | 'CUSTOM_QUOTE'
  pricingTiers: PricingTier[]
}

interface PricingSelectorProps {
  service: Service
  onPriceChange?: (label: string, price: number) => void
}

export function PricingSelector({ service, onPriceChange }: PricingSelectorProps) {
  const [selectedTier, setSelectedTier] = useState<string>(
    service.pricingTiers[0]?.id || ''
  )
  const [sqft, setSqft] = useState<string>('')

  const handleTierSelect = (tierId: string) => {
    setSelectedTier(tierId)
    const tier = service.pricingTiers.find((t) => t.id === tierId)
    if (tier && onPriceChange) {
      onPriceChange(tier.label, tier.price)
    }
  }

  const handleSqftChange = (value: string) => {
    setSqft(value)
    const num = parseFloat(value)
    if (!isNaN(num) && onPriceChange) {
      onPriceChange(`${num} sqft`, num * service.basePrice)
    }
  }

  // FIXED: Single price display
  if (service.priceType === 'FIXED') {
    return (
      <div className="rounded-xl border-2 border-primary bg-primary/5 p-4">
        <div className="flex items-center justify-between">
          <span className="font-medium">Standard Service</span>
          <span className="text-2xl font-bold text-primary">
            ₹{service.basePrice}
          </span>
        </div>
      </div>
    )
  }

  // PER_SQFT: Input based
  if (service.priceType === 'PER_SQFT') {
    const calculatedPrice = sqft ? parseFloat(sqft) * service.basePrice : 0
    return (
      <div className="space-y-3">
        <div>
          <Label htmlFor="sqft">Area (sqft)</Label>
          <Input
            id="sqft"
            type="number"
            placeholder="Enter area in sqft"
            value={sqft}
            onChange={(e) => handleSqftChange(e.target.value)}
            className="mt-1"
          />
        </div>
        <div className="text-sm text-muted-foreground">
          Rate: ₹{service.basePrice}/sqft
        </div>
        {calculatedPrice > 0 && (
          <div className="rounded-xl border-2 border-primary bg-primary/5 p-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">Estimated Price</span>
              <span className="text-2xl font-bold text-primary">
                ₹{calculatedPrice.toFixed(0)}
              </span>
            </div>
          </div>
        )}
      </div>
    )
  }

  // CUSTOM_QUOTE: Request quote button
  if (service.priceType === 'CUSTOM_QUOTE') {
    return (
      <div className="text-center py-4">
        <p className="text-muted-foreground mb-4">
          Custom quote ke liye humse contact karein
        </p>
        <Button className="w-full bg-primary hover:bg-primary/90">
          Request Free Quote
        </Button>
      </div>
    )
  }

  // STARTING_AT: Radio group for tiers
  return (
    <RadioGroup
      value={selectedTier}
      onValueChange={handleTierSelect}
      className="space-y-2"
    >
      {service.pricingTiers.map((tier) => (
        <div
          key={tier.id}
          className={`flex items-center justify-between rounded-xl border-2 p-4 cursor-pointer transition-all ${
            selectedTier === tier.id
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50'
          }`}
        >
          <div className="flex items-center gap-3">
            <RadioGroupItem value={tier.id} id={tier.id} />
            <Label htmlFor={tier.id} className="cursor-pointer font-medium">
              {tier.label}
            </Label>
          </div>
          <div className="text-right">
            <span className="text-lg font-bold text-primary">₹{tier.price}</span>
            {tier.duration && (
              <div className="text-xs text-muted-foreground">{tier.duration}</div>
            )}
          </div>
        </div>
      ))}
    </RadioGroup>
  )
}