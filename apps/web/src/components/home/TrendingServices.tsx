'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Star, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ServiceImageWithFallback } from '@/components/services/ServiceImageWithFallback'
import { ServiceWithDetails } from '@/types'

interface Props {
  services: ServiceWithDetails[]
}

export default function TrendingServices({ services }: Props) {
  if (!services || services.length === 0) return null

  return (
    <section className="py-10 md:py-14 bg-muted/30">
      <div className="max-w-[1400px] mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between mb-6 md:mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">Trending Services</h2>
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

        <div className="flex md:grid md:grid-cols-4 gap-4 md:gap-5 overflow-x-auto pb-4 md:pb-0 md:overflow-visible snap-x snap-mandatory">
          {services.map((service, i) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="min-w-[220px] md:min-w-0 snap-start bg-card border border-border rounded-2xl overflow-hidden hover:shadow-md transition-all group"
            >
              {/* ✅ Image-forward: emoji hataya, real service.image use ho
                  raha hai, bigger proportion (h-32 → h-40) */}
              <div className="relative h-40">
                <ServiceImageWithFallback
                  src={service.image}
                  alt={service.name}
                  categorySlug={service.subCategory?.category?.slug}
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>

              <div className="p-4 space-y-2">
                <h3 className="font-semibold text-sm text-foreground line-clamp-2">
                  {service.name}
                </h3>

                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span className="text-xs font-medium">{service.avgRating.toFixed(1)}</span>
                  <span className="text-xs text-muted-foreground">
                    ({service.totalReviews})
                  </span>
                </div>

                <p className="text-primary font-bold text-sm">
                  {service.priceType === 'FIXED'
                    ? `₹${service.basePrice}`
                    : `Starting ₹${service.basePrice}`}
                </p>

                <Button
                  asChild
                  size="sm"
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
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