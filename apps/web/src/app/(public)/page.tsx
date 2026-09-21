import { db } from '@/lib/db'
import HeroSection from '@/components/home/HeroSection'
import CategoryGrid from '@/components/home/CategoryGrid'
import TrendingServices from '@/components/home/TrendingServices'
import HowItWorks from '@/components/home/HowItWorks'
import SpecialOffers from '@/components/home/SpecialOffers'
import Testimonials from '@/components/home/Testimonials'
import { CategoryWithSubs, ServiceWithDetails } from '@/types'

export default async function HomePage() {
  // Fetch categories with subcategories
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

  // Fetch trending services
  const trendingServices = await db.service.findMany({
    where: { isTrending: true, isActive: true },
    include: {
      subCategory: {
        include: { category: true },
      },
    },
    take: 8,
    orderBy: { avgRating: 'desc' },
  })

  return (
    <>
      <HeroSection />
      <CategoryGrid categories={categories as CategoryWithSubs[]} />
      <TrendingServices services={trendingServices as ServiceWithDetails[]} />
      <HowItWorks />
      <SpecialOffers />
      <Testimonials />
    </>
  )
}
