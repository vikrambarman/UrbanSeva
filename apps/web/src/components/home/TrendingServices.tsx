'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Star, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ServiceWithDetails } from '@/types'

interface Props {
  services: ServiceWithDetails[]
}

export default function TrendingServices({ services }: Props) {
  if (!services || services.length === 0) return null

  return (
    <section className="py-12 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Heading */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              Trending Services
            </h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Sabse zyada book hone wali services
            </p>
          </div>
          <Button variant="ghost" asChild className="hidden md:flex">
            <Link href="/services" className="flex items-center gap-1">
              Sab dekho <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        {/* Horizontal Scroll Mobile / Grid Desktop */}
        <div className="flex md:grid md:grid-cols-4 gap-4 overflow-x-auto pb-4 md:pb-0 md:overflow-visible">
          {services.map((service, i) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="min-w-[200px] md:min-w-0 bg-card border border-border rounded-2xl overflow-hidden hover:shadow-md transition-all group"
            >
              {/* Image Placeholder */}
              <div className="h-32 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                <span className="text-5xl">
                  {service.subCategory?.category?.icon || '🔧'}
                </span>
              </div>

              {/* Content */}
              <div className="p-4 space-y-2">
                <h3 className="font-semibold text-sm text-foreground line-clamp-2">
                  {service.name}
                </h3>

                {/* Rating */}
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span className="text-xs font-medium">
                    {service.avgRating.toFixed(1)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({service.totalReviews})
                  </span>
                </div>

                {/* Price */}
                <p className="text-primary font-bold text-sm">
                  {service.priceType === 'FIXED'
                    ? `₹${service.basePrice}`
                    : `Starting ₹${service.basePrice}`}
                </p>

                {/* Book Button */}
                <Button
                  asChild
                  size="sm"
                  className="w-full bg-primary hover:bg-primary/90 text-white"
                >
                  <Link
                    href={`/services/${service.subCategory?.category?.slug}/${service.subCategory?.slug}/${service.slug}`}
                  >
                    Book Now
                  </Link>
                </Button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Mobile View All */}
        <div className="mt-4 md:hidden">
          <Button variant="outline" asChild className="w-full">
            <Link href="/services" className="flex items-center gap-2">
              Sab Services Dekho <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
