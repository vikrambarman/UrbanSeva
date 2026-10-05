'use client'

import { useState } from 'react'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Package, Ruler, MessageCircle, Check } from 'lucide-react'

// ✅ ENHANCED — Premium pricing selector design
// Changes:
// 1. Icons added to each price type section
// 2. Better visual hierarchy with badges
// 3. Enhanced hover effects on tier cards
// 4. CUSTOM_QUOTE: Better CTA design

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

  // ✅ FIXED price display — Enhanced
  if (service.priceType === 'FIXED') {
    return (
      <div className="rounded-xl border-2 border-primary bg-gradient-to-br from-primary/10 to-primary/5 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
              <Package className="h-5 w-5 text-primary" />
            </div>
            <div>
              <span className="font-semibold text-foreground">Standard Service</span>
              <p className="text-xs text-muted-foreground">All-inclusive price</p>
            </div>
          </div>
          <span className="text-2xl font-bold text-primary">₹{service.basePrice}</span>
        </div>
      </div>
    )
  }

  // ✅ PER_SQFT — Enhanced
  if (service.priceType === 'PER_SQFT') {
    const calculatedPrice = sqft ? parseFloat(sqft) * service.basePrice : 0
    return (
      <div className="space-y-4">
        <div>
          <Label htmlFor="sqft" className="flex items-center gap-2 mb-2">
            <Ruler className="h-4 w-4 text-primary" />
            Area (sqft)
          </Label>
          <Input
            id="sqft"
            type="number"
            placeholder="Enter area in sqft"
            value={sqft}
            onChange={(e) => handleSqftChange(e.target.value)}
            className="mt-1"
          />
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
          <span>Rate:</span>
          <span className="font-semibold text-foreground">₹{service.basePrice}/sqft</span>
        </div>
        {calculatedPrice > 0 && (
          <div className="rounded-xl border-2 border-primary bg-gradient-to-br from-primary/10 to-primary/5 p-5">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-foreground">Estimated Price</span>
                <p className="text-xs text-muted-foreground">Based on {sqft} sqft</p>
              </div>
              <span className="text-2xl font-bold text-primary">
                ₹{calculatedPrice.toFixed(0)}
              </span>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ✅ CUSTOM_QUOTE — Enhanced
  if (service.priceType === 'CUSTOM_QUOTE') {
    return (
      <div className="text-center py-6 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mx-auto mb-3">
          <MessageCircle className="h-6 w-6 text-primary" />
        </div>
        <p className="text-foreground font-medium mb-1">
          Custom pricing available
        </p>
        <p className="text-sm text-muted-foreground mb-4">
          Apni requirements ke hisaab se quote paayein
        </p>
        <Button className="bg-primary hover:bg-primary/90 px-6">
          Request Free Quote
        </Button>
      </div>
    )
  }

  // ✅ STARTING_AT: Radio group — Enhanced
  return (
    <RadioGroup
      value={selectedTier}
      onValueChange={handleTierSelect}
      className="space-y-3"
    >
      {service.pricingTiers.map((tier) => (
        <div
          key={tier.id}
          className={`flex items-center justify-between rounded-xl border-2 p-4 cursor-pointer transition-all ${
            selectedTier === tier.id
              ? 'border-primary bg-gradient-to-br from-primary/10 to-primary/5 shadow-sm'
              : 'border-gray-200 hover:border-primary/50 hover:bg-muted/30'
          }`}
        >
          <div className="flex items-center gap-3">
            <RadioGroupItem value={tier.id} id={tier.id} />
            <div>
              <Label htmlFor={tier.id} className="cursor-pointer font-medium text-foreground">
                {tier.label}
              </Label>
              {tier.duration && (
                <p className="text-xs text-muted-foreground mt-0.5">{tier.duration}</p>
              )}
            </div>
          </div>
          <div className="text-right">
            <span className="text-lg font-bold text-primary">₹{tier.price}</span>
            {selectedTier === tier.id && (
              <div className="flex items-center gap-1 text-xs text-primary mt-0.5">
                <Check className="h-3 w-3" />
                <span>Selected</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </RadioGroup>
  )
}