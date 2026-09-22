'use client'

import { motion } from 'framer-motion'
import { Star, Clock, Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ServiceImageWithFallback } from './ServiceImageWithFallback'
import Link from 'next/link'

interface ServiceInclusion {
  id: string
  text: string
}

interface ServicePricing {
  id: string
  label: string
  price: number
}

interface Service {
  id: string
  name: string
  slug: string
  description: string
  image: string | null
  basePrice: number
  priceType: 'FIXED' | 'STARTING_AT' | 'PER_SQFT' | 'CUSTOM_QUOTE'
  duration: string
  professionals: number
  avgRating: number
  totalReviews: number
  isTrending: boolean
  inclusions: ServiceInclusion[]
  pricingTiers: ServicePricing[]
}

interface ServiceCardProps {
  service: Service
  variant?: 'row' | 'grid'
  categorySlug: string
  subCategorySlug: string
}

export function ServiceCard({ service, variant = 'row', categorySlug, subCategorySlug }: ServiceCardProps) {
  const serviceUrl = `/services/${categorySlug}/${subCategorySlug}/${service.slug}`

  const getPriceDisplay = () => {
    switch (service.priceType) {
      case 'FIXED':
        return `₹${service.basePrice}`
      case 'STARTING_AT':
        return `Starts ₹${service.basePrice}`
      case 'PER_SQFT':
        return `₹${service.basePrice}/sqft`
      case 'CUSTOM_QUOTE':
        return 'Free Quote'
      default:
        return `₹${service.basePrice}`
    }
  }

  if (variant === 'grid') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="group rounded-2xl border bg-card overflow-hidden hover:shadow-lg transition-all duration-300"
      >
        <Link href={serviceUrl}>
          <div className="relative h-48 overflow-hidden">
            <ServiceImageWithFallback
              src={service.image}
              alt={service.name}
              categorySlug={categorySlug}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            {service.isTrending && (
              <Badge className="absolute top-3 right-3 bg-primary">
                🔥 Trending
              </Badge>
            )}
          </div>
          <div className="p-4 space-y-3">
            <h3 className="font-semibold text-lg line-clamp-1">{service.name}</h3>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              {service.avgRating > 0 && (
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium text-foreground">{service.avgRating}</span>
                  <span>({service.totalReviews})</span>
                </div>
              )}
              {service.duration && (
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{service.duration}</span>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="text-primary font-bold text-lg">{getPriceDisplay()}</span>
              <Button size="sm" className="bg-primary hover:bg-primary/90">
                View Details
              </Button>
            </div>
          </div>
        </Link>
      </motion.div>
    )
  }

  // Row variant (default)
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      className="group rounded-2xl border bg-card overflow-hidden hover:shadow-lg transition-all duration-300"
    >
      <Link href={serviceUrl}>
        <div className="flex flex-col sm:flex-row">
          {/* Image */}
          <div className="relative sm:w-64 h-48 sm:h-auto overflow-hidden flex-shrink-0">
            <ServiceImageWithFallback
              src={service.image}
              alt={service.name}
              categorySlug={categorySlug}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            {service.isTrending && (
              <Badge className="absolute top-3 left-3 bg-primary">
                🔥 Trending
              </Badge>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 p-5 sm:p-6 flex flex-col justify-between">
            <div className="space-y-3">
              <h3 className="font-bold text-xl group-hover:text-primary transition-colors">
                {service.name}
              </h3>

              <p className="text-muted-foreground text-sm line-clamp-2">
                {service.description}
              </p>

              {/* Stats */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                {service.avgRating > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium text-foreground">{service.avgRating}</span>
                    <span>({service.totalReviews} reviews)</span>
                  </div>
                )}
                {service.duration && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{service.duration}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>{service.professionals} Expert{service.professionals > 1 ? 's' : ''}</span>
                </div>
              </div>

              {/* Inclusions preview */}
              {service.inclusions.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {service.inclusions.slice(0, 3).map((inc) => (
                    <span key={inc.id} className="text-xs bg-muted px-2 py-1 rounded-full">
                      ✓ {inc.text}
                    </span>
                  ))}
                  {service.inclusions.length > 3 && (
                    <span className="text-xs text-muted-foreground">
                      +{service.inclusions.length - 3} more
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Price & CTA */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <div>
                <span className="text-2xl font-bold text-primary">{getPriceDisplay()}</span>
              </div>
              <Button size="lg" className="bg-primary hover:bg-primary/90">
                Book Now →
              </Button>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}