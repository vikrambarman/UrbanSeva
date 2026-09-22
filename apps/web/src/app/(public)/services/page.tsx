import CategoryGrid from '@/components/home/CategoryGrid'
import { db } from '@/lib/db'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'All Services | ServiceApp - Ambikapur',
  description: 'Browse all home services in Ambikapur - Cleaning, Electrical, Plumbing, AC Repair and more.',
}

export default async function ServicesPage() {
  const categories = await db.category.findMany({
    where: { isActive: true },
    include: {
      subCategories: {
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
      },
    },
    orderBy: { sortOrder: 'asc' },
  })

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-primary/5 to-background py-12 md:py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Hamari Services
          </h1>
          <p className="text-muted-foreground text-center text-lg max-w-2xl mx-auto">
            Ambikapur mein 100+ professional home services available hain. 
            Apni zaroorat ke hisaab se service chuniye.
          </p>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="container mx-auto px-4 py-8 md:py-12">
        <CategoryGrid categories={categories} />
      </section>
    </div>
  )
}