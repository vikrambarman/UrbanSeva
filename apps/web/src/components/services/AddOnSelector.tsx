'use client'

import { useState } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Plus, Check } from 'lucide-react'

// ✅ ENHANCED — Better add-on selector design
// Changes:
// 1. Better visual feedback on selection
// 2. Icon changes based on selection state
// 3. Improved price display

interface AddOn {
  id: string
  name: string
  price: number
  description?: string | null
}

interface AddOnSelectorProps {
  addOns: AddOn[]
  onAddOnChange?: (selectedAddOns: AddOn[]) => void
}

export function AddOnSelector({ addOns, onAddOnChange }: AddOnSelectorProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const handleToggle = (addOn: AddOn) => {
    const newSelected = new Set(selected)
    if (newSelected.has(addOn.id)) {
      newSelected.delete(addOn.id)
    } else {
      newSelected.add(addOn.id)
    }
    setSelected(newSelected)

    if (onAddOnChange) {
      const selectedAddOns = addOns.filter((a) => newSelected.has(a.id))
      onAddOnChange(selectedAddOns)
    }
  }

  if (addOns.length === 0) return null

  return (
    <div className="space-y-3">
      {addOns.map((addOn) => {
        const isSelected = selected.has(addOn.id)
        
        return (
          <div
            key={addOn.id}
            className={`flex items-start gap-3 rounded-xl border-2 p-4 cursor-pointer transition-all ${
              isSelected
                ? 'border-primary bg-gradient-to-br from-primary/10 to-primary/5 shadow-sm'
                : 'border-gray-200 hover:border-primary/50 hover:bg-muted/30'
            }`}
            onClick={() => handleToggle(addOn)}
          >
            <Checkbox
              id={addOn.id}
              checked={isSelected}
              onCheckedChange={() => handleToggle(addOn)}
              className="mt-0.5"
            />
            <div className="flex-1">
              <Label htmlFor={addOn.id} className="cursor-pointer font-medium text-foreground">
                {addOn.name}
              </Label>
              {addOn.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {addOn.description}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-primary font-semibold whitespace-nowrap">
              {isSelected ? (
                <Check className="w-4 h-4" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              <span>₹{addOn.price}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}