'use client'

import { useState } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

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
      {addOns.map((addOn) => (
        <div
          key={addOn.id}
          className={`flex items-start gap-3 rounded-xl border p-4 cursor-pointer transition-all ${
            selected.has(addOn.id)
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50'
          }`}
          onClick={() => handleToggle(addOn)}
        >
          <Checkbox
            id={addOn.id}
            checked={selected.has(addOn.id)}
            onCheckedChange={() => handleToggle(addOn)}
            className="mt-0.5"
          />
          <div className="flex-1">
            <Label htmlFor={addOn.id} className="cursor-pointer font-medium">
              {addOn.name}
            </Label>
            {addOn.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {addOn.description}
              </p>
            )}
          </div>
          <span className="text-primary font-semibold whitespace-nowrap">
            +₹{addOn.price}
          </span>
        </div>
      ))}
    </div>
  )
}