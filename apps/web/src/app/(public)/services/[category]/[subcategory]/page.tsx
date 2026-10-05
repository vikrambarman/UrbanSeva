import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { Star, Clock, Users, Sparkles } from 'lucide-react'
import { ServiceBreadcrumb } from '@/components/services/ServiceBreadcrumb'
import { SITE_CONFIG } from '@/lib/config'
import { getCategoryIcon } from '@/lib/category-icons'
import { SubCategoryServicesClient } from './SubCategoryServicesClient'

// ✅ ENHANCED — Premium hero header design (category page jaisa)
// Changes:
// 1. Hero header with gradient background + category icon
// 2. Stats badges (services count, avg rating, total reviews)
// 3. Better visual hierarchy and spacing
// 4. Consistent design language with category page

interface Props {
  params: Promise<{ category: string; subcategory: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { subcategory } = await params

  const subCat = await db.subCategory.findUnique({
    where: { slug: subcategory },
    include: { category: true },
  })

  if (!subCat) return { title: 'Services Not Found' }

  return {
    title: `${subCat.name} Services in ${subCat.category.name} | ${SITE_CONFIG.name}`,
    description: subCat.description || `Professional ${subCat.name} services in ${SITE_CONFIG.city}`,
  }
}

export default async function SubCategoryPage({ params }: Props) {
  const { category, subcategory } = await params

  const subCat = await db.subCategory.findUnique({
    where: { slug: subcategory, isActive: true },
    include: {
      category: true,
      services: {
        where: { isActive: true },
        include: {
          inclusions: { take: 4, orderBy: { sortOrder: 'asc' } },
          pricingTiers: { orderBy: { sortOrder: 'asc' } },
        },
        orderBy: [{ isTrending: 'desc' }, { avgRating: 'desc' }],
      },
    },
  })

  if (!subCat) notFound()

  const Icon = getCategoryIcon(subCat.slug)

  // ✅ Calculate aggregate stats
  const totalReviews = subCat.services.reduce((sum, s) => sum + s.totalReviews, 0)
  const avgRating =
    subCat.services.length > 0
      ? subCat.services.reduce((sum, s) => sum + s.avgRating, 0) / subCat.services.length
      : 0

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-6 md:py-8">
        {/* Breadcrumb */}
        <ServiceBreadcrumb
          category={{ name: subCat.category.name, slug: subCat.category.slug }}
          subCategory={{ name: subCat.name, slug: subCat.slug }}
        />

        {/* ✅ Hero Header Section — Category page jaisa premium design */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/10 p-6 md:p-10 mt-6 mb-8">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
          
          <div className="relative z-10">
            {/* Icon + Title */}
            <div className="flex items-start gap-4 mb-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 shrink-0">
                <Icon className="h-7 w-7 text-primary" strokeWidth={1.75} />
              </div>
              <div>
                <h1 className="text-2xl md:text-4xl font-bold text-foreground mb-2">
                  {subCat.name}
                </h1>
                {subCat.description && (
                  <p className="text-muted-foreground text-sm md:text-base max-w-2xl">
                    {subCat.description}
                  </p>
                )}
              </div>
            </div>

            {/* Stats Badges */}
            <div className="flex flex-wrap items-center gap-3 mt-6">
              <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 border border-primary/10">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-foreground">
                  {subCat.services.length} {subCat.services.length === 1 ? 'Service' : 'Services'}
                </span>
              </div>

              {avgRating > 0 && (
                <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 border border-primary/10">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-medium text-foreground">
                    {avgRating.toFixed(1)} Rating
                  </span>
                </div>
              )}

              {totalReviews > 0 && (
                <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 border border-primary/10">
                  <Users className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">
                    {totalReviews} Reviews
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Services Section */}
        <SubCategoryServicesClient
          services={subCat.services}
          categorySlug={category}
          subCategorySlug={subcategory}
        />
      </div>
    </div>
  )
}