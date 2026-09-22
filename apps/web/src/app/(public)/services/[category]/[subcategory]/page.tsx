import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { ServiceBreadcrumb } from '@/components/services/ServiceBreadcrumb';
import { ServiceCard } from '@/components/services/ServiceCard';

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
    title: `${subCat.name} Services in ${subCat.category.name} | ServiceApp`,
    description: subCat.description || `Professional ${subCat.name} services in Ambikapur`,
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

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 md:py-8">
        {/* Breadcrumb */}
        <ServiceBreadcrumb
          category={{ name: subCat.category.name, slug: subCat.category.slug }}
          subCategory={{ name: subCat.name, slug: subCat.slug }}
        />

        {/* Header */}
        <div className="mt-6 mb-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">
            {subCat.name}
          </h1>
          {subCat.description && (
            <p className="text-muted-foreground text-lg">
              {subCat.description}
            </p>
          )}
          <p className="text-sm text-muted-foreground mt-2">
            {subCat.services.length} services available
          </p>
        </div>

        {/* Services List - Row/Column Layout */}
        {subCat.services.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">
              Koi services available nahi hain is category mein.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {subCat.services.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                variant="row"
                categorySlug={category}
                subCategorySlug={subcategory}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}