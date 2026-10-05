'use client'

import { useState, useEffect, useMemo } from 'react'
import { ArrowUpDown, LayoutGrid, List, SearchX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ServiceCard } from '@/components/services/ServiceCard'
// ✅ FIX: Service type import kiya ServiceCard se — single source of truth
import type { Service } from '@/components/services/ServiceCard'

// ✅ Client component for sort + view toggle
// Reason: Server component mein localStorage/state nahi use kar sakte.

interface SubCategoryServicesClientProps {
  services: Service[]
  categorySlug: string
  subCategorySlug: string
}

type SortOption = 'rating' | 'price-low' | 'price-high' | 'duration'
type ViewMode = 'grid' | 'row'

export function SubCategoryServicesClient({
  services,
  categorySlug,
  subCategorySlug,
}: SubCategoryServicesClientProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [sortBy, setSortBy] = useState<SortOption>('rating')
  const [mounted, setMounted] = useState(false)

  // ✅ localStorage se view mode load karo (client-side only)
  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem('services-view-mode')
    if (saved === 'grid' || saved === 'row') {
      setViewMode(saved)
    } else {
      // Default: mobile pe grid, desktop pe row
      setViewMode(window.innerWidth < 768 ? 'grid' : 'row')
    }
  }, [])

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode)
    localStorage.setItem('services-view-mode', mode)
  }

  // ✅ Sort logic
  const sortedServices = useMemo(() => {
    const sorted = [...services]

    switch (sortBy) {
      case 'rating':
        return sorted.sort((a, b) => b.avgRating - a.avgRating)
      case 'price-low':
        return sorted.sort((a, b) => a.basePrice - b.basePrice)
      case 'price-high':
        return sorted.sort((a, b) => b.basePrice - a.basePrice)
      case 'duration':
        return sorted.sort((a, b) => a.duration.localeCompare(b.duration))
      default:
        return sorted
    }
  }, [services, sortBy])

  // ✅ Empty state
  if (services.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
          <SearchX className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground text-lg mb-2">
          Koi services available nahi hain is category mein.
        </p>
        <Button asChild variant="outline" className="mt-4">
          <a href="/services">Browse other categories</a>
        </Button>
      </div>
    )
  }

  return (
    <>
      {/* Controls Bar — Sort + View Toggle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        {/* Sort Dropdown */}
        <div className="flex items-center gap-2">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={(val) => setSortBy(val as SortOption)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rating">Rating (Highest)</SelectItem>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
              <SelectItem value="duration">Duration (Shortest)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* View Toggle Buttons */}
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleViewModeChange('grid')}
            className="h-8 w-8 p-0"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'row' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleViewModeChange('row')}
            className="h-8 w-8 p-0"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Services Grid/Row */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {sortedServices.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              variant="grid"
              categorySlug={categorySlug}
              subCategorySlug={subCategorySlug}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {sortedServices.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              variant="row"
              categorySlug={categorySlug}
              subCategorySlug={subCategorySlug}
            />
          ))}
        </div>
      )}
    </>
  )
}