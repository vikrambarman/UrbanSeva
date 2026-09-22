import { ServiceCard } from '@/components/services/ServiceCard'
import { db } from '@/lib/db'
import { Search } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Search Services | ServiceApp',
}

interface Props {
  searchParams: Promise<{ q?: string }>
}

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams
  const query = q || ''

  let services: any[] = []

  if (query.trim()) {
    services = await db.service.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
      },
      include: {
        subCategory: {
          include: { category: true },
        },
        inclusions: { take: 4, orderBy: { sortOrder: 'asc' } },
        pricingTiers: { orderBy: { sortOrder: 'asc' } },
      },
      take: 20,
      orderBy: { avgRating: 'desc' },
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 md:py-8">
        {/* Search Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Search className="w-6 h-6 text-muted-foreground" />
            <h1 className="text-2xl md:text-3xl font-bold">
              Search Results
            </h1>
          </div>
          {query && (
            <p className="text-muted-foreground">
              Showing results for &quot;<span className="font-semibold text-foreground">{query}</span>&quot;
              {services.length > 0 && ` — ${services.length} services found`}
            </p>
          )}
        </div>

        {/* Results */}
        {services.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-xl font-semibold mb-2">
              {query ? 'Koi results nahi mile' : 'Search karein'}
            </h2>
            <p className="text-muted-foreground">
              {query
                ? 'Kripya doosre keywords se search karein ya categories browse karein.'
                : 'Apni zaroorat ki service search karein.'}
            </p>
            <a
              href="/services"
              className="inline-block mt-6 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 px-6 rounded-xl transition-colors"
            >
              Browse All Services
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            {services.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                variant="row"
                categorySlug={service.subCategory.category.slug}
                subCategorySlug={service.subCategory.slug}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}