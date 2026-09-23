import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Star, Clock, Users, Shield } from 'lucide-react'
import type { Metadata } from 'next'
import { ServiceBreadcrumb } from '@/components/services/ServiceBreadcrumb'
import { ServiceImageWithFallback } from '@/components/services/ServiceImageWithFallback'
import { WhatsCovered } from '@/components/services/WhatsCovered'
import { AssignedProviders } from '@/components/services/AssignedProviders'
import { ServiceFAQs } from '@/components/services/ServiceFAQs'
import { PricingSelector } from '@/components/services/PricingSelector'
import { AddOnSelector } from '@/components/services/AddOnSelector'
import { StickyBookingBar } from '@/components/services/StickyBookingBar'
import { AddToCartButton } from '@/components/services/AddToCartButton'

interface Props {
  params: Promise<{ category: string; subcategory: string; service: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { service: serviceSlug } = await params

  const service = await db.service.findUnique({
    where: { slug: serviceSlug },
    include: { subCategory: { include: { category: true } } },
  })

  if (!service) return { title: 'Service Not Found' }

  return {
    title: `${service.name} | ServiceApp Ambikapur`,
    description: service.description,
  }
}

export default async function ServiceDetailPage({ params }: Props) {
  const { category, subcategory, service: serviceSlug } = await params

  const service = await db.service.findUnique({
    where: { slug: serviceSlug, isActive: true },
    include: {
      subCategory: {
        include: { category: true },
      },
      inclusions: { orderBy: { sortOrder: 'asc' } },
      exclusions: { orderBy: { sortOrder: 'asc' } },
      pricingTiers: { orderBy: { sortOrder: 'asc' } },
      addOns: true,
      faqs: { orderBy: { sortOrder: 'asc' } },
      providerServices: {
        where: { isActive: true },
        include: {
          provider: {
            include: {
              user: {
                select: { id: true, name: true, avatar: true },
              },
            },
          },
        },
      },
    },
  })

  if (!service) notFound()

  const providers = service.providerServices.map((ps) => ps.provider)

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <div className="container mx-auto px-4 py-6 md:py-8">
        {/* Breadcrumb */}
        <ServiceBreadcrumb
          category={{ name: service.subCategory.category.name, slug: service.subCategory.category.slug }}
          subCategory={{ name: service.subCategory.name, slug: service.subCategory.slug }}
          service={{ name: service.name, slug: service.slug }}
        />

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT COLUMN - Main Content (2/3) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Service Image */}
            <div className="relative rounded-2xl overflow-hidden h-64 md:h-80">
              <ServiceImageWithFallback
                src={service.image}
                alt={service.name}
                categorySlug={category}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Service Header */}
            <div>
              <div className="flex flex-wrap gap-2 mb-3">
                {service.isTrending && (
                  <Badge variant="default" className="bg-primary">
                    🔥 Trending
                  </Badge>
                )}
                {service.guarantee && (
                  <Badge variant="outline" className="border-green-500 text-green-700">
                    <Shield className="w-3 h-3 mr-1" />
                    {service.guarantee}
                  </Badge>
                )}
              </div>

              <h1 className="text-2xl md:text-3xl font-bold mb-3">
                {service.name}
              </h1>

              {/* Rating & Stats */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                {service.avgRating > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold text-foreground">{service.avgRating}</span>
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
            </div>

            <Separator />

            {/* Description */}
            <div>
              <h2 className="text-lg font-semibold mb-2">About this service</h2>
              <p className="text-muted-foreground leading-relaxed">
                {service.description}
              </p>
            </div>

            {/* What's Covered */}
            <WhatsCovered
              inclusions={service.inclusions}
              exclusions={service.exclusions}
            />

            {/* Assigned Providers */}
            {providers.length > 0 && (
              <AssignedProviders providers={providers} />
            )}

            {/* FAQs */}
            {service.faqs.length > 0 && (
              <ServiceFAQs faqs={service.faqs} />
            )}
          </div>

          {/* RIGHT COLUMN - Booking Sidebar (1/3) */}
          <div className="hidden lg:block">
            <div className="sticky top-24 space-y-4">
              {/* Pricing Card */}
              <div className="rounded-2xl border bg-card p-6 space-y-4">
                <h3 className="font-semibold text-lg">Select Package</h3>
                <PricingSelector service={service} />

                {/* Add-ons */}
                {service.addOns.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-medium mb-3">Add-ons</h4>
                      <AddOnSelector addOns={service.addOns} />
                    </div>
                  </>
                )}

                <Separator />

                {/* Action Buttons */}
                <div className="space-y-3">
                  <AddToCartButton service={service} />

                  <a
                    href={`/booking/${service.slug}`}
                    className="block w-full text-center border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground font-semibold py-3 px-6 rounded-xl transition-colors"
                  >
                    Book Now →
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Booking Bar */}
      <StickyBookingBar
        service={service}
        serviceUrl={`/booking/${service.slug}`}
      />
    </div>
  )
}