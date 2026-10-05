import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Sparkles } from 'lucide-react'
import { SITE_CONFIG } from '@/lib/config'
import { getCategoryIcon } from '@/lib/category-icons'
import { ServiceImageWithFallback } from '@/components/services/ServiceImageWithFallback'

// ✅ ENHANCED — Clean, minimal, attractive category page
// Changes:
// 1. Hero-style header with gradient overlay
// 2. Better stats display (subcategories count + services count)
// 3. Improved subcategory cards with hover effects
// 4. "Explore" CTA on each card
// 5. Better typography and spacing

interface Props {
  params: Promise<{ category: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params

  const cat = await db.category.findUnique({
    where: { slug: category },
    include: {
      subCategories: {
        where: { isActive: true },
        include: {
          _count: {
            select: {
              services: {
                where: { isActive: true },
              },
            },
          },
        },
      },
    },
  })

  if (!cat) return { title: 'Category Not Found' }

  const totalServices = cat.subCategories.reduce(
    (sum, sub) => sum + sub._count.services,
    0
  )

  return {
    title: `${cat.name} Services in ${SITE_CONFIG.city} | ${SITE_CONFIG.name}`,
    description:
      cat.description ||
      `Professional ${cat.name} services in ${SITE_CONFIG.city}. ${totalServices}+ services available.`,
  }
}

export default async function CategoryPage({ params }: Props) {
  const { category } = await params

  const cat = await db.category.findUnique({
    where: { slug: category, isActive: true },
    include: {
      subCategories: {
        where: { isActive: true },
        include: {
          _count: {
            select: {
              services: {
                where: { isActive: true },
              },
            },
          },
        },
        orderBy: { sortOrder: 'asc' },
      },
    },
  })

  if (!cat) notFound()

  const Icon = getCategoryIcon(cat.slug)
  const totalServices = cat.subCategories.reduce(
    (sum, sub) => sum + sub._count.services,
    0
  )

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-6 md:py-8">
        {/* ✅ Hero Header Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/10 p-6 md:p-10 mb-8">
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
                  {cat.name}
                </h1>
                {cat.description && (
                  <p className="text-muted-foreground text-sm md:text-base max-w-2xl">
                    {cat.description}
                  </p>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap items-center gap-4 mt-6">
              <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 border border-primary/10">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-foreground">
                  {cat.subCategories.length} {cat.subCategories.length === 1 ? 'Service Type' : 'Service Types'}
                </span>
              </div>
              <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 border border-primary/10">
                <span className="text-sm font-medium text-foreground">
                  {totalServices}+ Professional Services
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ✅ Subcategories Section */}
        {cat.subCategories.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
              <Icon className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-lg mb-2">
              Koi subcategories available nahi hain is category mein.
            </p>
            <p className="text-sm text-muted-foreground">
              Please check back later or explore other categories.
            </p>
          </div>
        ) : (
          <>
            {/* Section Heading */}
            <div className="mb-6">
              <h2 className="text-xl md:text-2xl font-bold text-foreground">
                Explore Services
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Choose a service type to view available options
              </p>
            </div>

            {/* Subcategories Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
              {cat.subCategories.map((subCat) => (
                <Link
                  key={subCat.id}
                  href={`/services/${category}/${subCat.slug}`}
                  className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-card hover:border-primary/30 hover:shadow-xl transition-all duration-300"
                >
                  {/* Image */}
                  <div className="relative h-52 overflow-hidden">
                    <ServiceImageWithFallback
                      src={subCat.image}
                      alt={subCat.name}
                      categorySlug={category}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                    
                    {/* Service count badge */}
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-foreground text-xs font-semibold px-2.5 py-1 rounded-full">
                      {subCat._count.services} {subCat._count.services === 1 ? 'service' : 'services'}
                    </div>

                    {/* Title on image */}
                    <div className="absolute bottom-0 left-0 right-0 p-5">
                      <h3 className="text-white font-bold text-lg mb-1 group-hover:text-primary-light transition-colors">
                        {subCat.name}
                      </h3>
                      {subCat.description && (
                        <p className="text-white/80 text-sm line-clamp-2">
                          {subCat.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* CTA Footer */}
                  <div className="flex items-center justify-between px-5 py-3 bg-muted/30 border-t border-gray-100">
                    <span className="text-sm font-medium text-foreground">
                      View Services
                    </span>
                    <ArrowRight className="h-4 w-4 text-primary group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}