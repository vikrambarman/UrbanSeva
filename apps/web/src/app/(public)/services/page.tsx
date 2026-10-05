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
        {/* ✅ FIXED: 'container mx-auto' → max-w-[1400px], Navbar/Hero ke
            consistent, scroll karte waqt width-jump avoid karne ke liye */}
        <div className="max-w-[1400px] mx-auto px-4 md:px-6">
          <h1 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Hamari Services
          </h1>
          <p className="text-muted-foreground text-center text-lg max-w-2xl mx-auto">
            Ambikapur mein 100+ professional home services available hain.
            Apni zaroorat ke hisaab se service chuniye.
          </p>
        </div>
      </section>

      {/*
        ✅ FIXED: Do bugs yahan the:
        1. CategoryGrid ko pehle koi limit-override nahi mil raha tha,
           isliye ye page bhi (poori list hone ke bajaye) sirf 9 categories
           dikhata tha, aur uska "View All" tile khud isi page par point
           karta tha — isliye "View All" click karne par kuchh naya nahi
           dikhta tha.
        2. CategoryGrid apna khud ka max-w-[1400px] container leta hai,
           lekin yahan ek extra <section className="container..."> ke
           andar wrap kiya hua tha — double-nested container, width/padding
           mismatch. Ab seedha render ho raha hai, bina extra wrapper ke.
        showHeading={false} isliye diya hai kyunki upar Hero mein already
        "Hamari Services" h1 hai — duplicate heading avoid karne ke liye.
      */}
      <CategoryGrid categories={categories} showHeading={false} />
    </div>
  )
}