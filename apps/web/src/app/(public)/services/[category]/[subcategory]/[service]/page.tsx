import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Star, Clock, Users, Shield, Flame, ArrowRight, CheckCircle2 } from 'lucide-react'
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
import { SITE_CONFIG } from '@/lib/config'

// ✅ ENHANCED — Premium service detail page
// Changes:
// 1. Metadata: Hardcoded "ServiceApp Ambikapur" → SITE_CONFIG
// 2. Hero header with gradient overlay on image
// 3. Enhanced stats section with better visual treatment
// 4. Sidebar card: Better design with subtle shadows
// 5. "Book Now →" → ArrowRight icon (consistency)
// 6. Better spacing and typography throughout

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

  // ✅ FIX: Hardcoded "ServiceApp Ambikapur" → SITE_CONFIG.name
  return {
    title: `${service.name} | ${SITE_CONFIG.name}`,
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
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-6 md:py-8">
        {/* Breadcrumb */}
        <ServiceBreadcrumb
          category={{ name: service.subCategory.category.name, slug: service.subCategory.category.slug }}
          subCategory={{ name: service.subCategory.name, slug: service.subCategory.slug }}
          service={{ name: service.name, slug: service.slug }}
        />

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column — Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* ✅ Hero Image Section with gradient overlay */}
            <div className="relative rounded-2xl overflow-hidden h-64 md:h-80 group">
              <ServiceImageWithFallback
                src={service.image}
                alt={service.name}
                categorySlug={category}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              
              {/* Badges on image */}
              <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                {service.isTrending && (
                  <Badge className="bg-primary text-white gap-1 shadow-lg">
                    <Flame className="w-3 h-3" />
                    Trending
                  </Badge>
                )}
                {service.guarantee && (
                  <Badge className="bg-green-500 text-white gap-1 shadow-lg">
                    <Shield className="w-3 h-3" />
                    {service.guarantee}
                  </Badge>
                )}
              </div>
            </div>

            {/* ✅ Title Section */}
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-3">{service.name}</h1>

              {/* Stats */}
              <div className="flex flex-wrap items-center gap-4 text-sm">
                {service.avgRating > 0 && (
                  <div className="flex items-center gap-1.5 bg-yellow-50 border border-yellow-200 rounded-full px-3 py-1.5">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold text-foreground">{service.avgRating}</span>
                    <span className="text-muted-foreground">({service.totalReviews})</span>
                  </div>
                )}
                {service.duration && (
                  <div className="flex items-center gap-1.5 bg-muted/50 rounded-full px-3 py-1.5">
                    <Clock className="w-4 h-4 text-primary" />
                    <span className="text-foreground font-medium">{service.duration}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 bg-muted/50 rounded-full px-3 py-1.5">
                  <Users className="w-4 h-4 text-primary" />
                  <span className="text-foreground font-medium">
                    {service.professionals} Expert{service.professionals > 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </div>

            <Separator />

            {/* ✅ About Section */}
            <div>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                About this service
              </h2>
              <p className="text-muted-foreground leading-relaxed">{service.description}</p>
            </div>

            <WhatsCovered inclusions={service.inclusions} exclusions={service.exclusions} />

            {providers.length > 0 && <AssignedProviders providers={providers} />}

            {service.faqs.length > 0 && <ServiceFAQs faqs={service.faqs} />}
          </div>

          {/* Right Column — Sidebar */}
          <div className="hidden lg:block">
            <div className="sticky top-24 space-y-4">
              {/* ✅ Enhanced Sidebar Card */}
              <div className="rounded-2xl border border-gray-200 bg-card shadow-sm p-6 space-y-5">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                  </span>
                  Select Package
                </h3>
                
                <PricingSelector service={service} />

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

                <div className="space-y-3">
                  <AddToCartButton service={service} />

                  {/* ✅ FIX: "→" character → ArrowRight icon */}
                  <Link
                    href={`/booking/${service.slug}`}
                    className="flex items-center justify-center gap-2 w-full border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground font-semibold py-3 px-6 rounded-xl transition-colors"
                  >
                    <span>Book Now</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <StickyBookingBar service={service} serviceUrl={`/booking/${service.slug}`} />
    </div>
  )
}