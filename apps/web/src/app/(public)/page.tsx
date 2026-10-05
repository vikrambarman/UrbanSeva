import type { Metadata } from 'next'
import { db } from '@/lib/db'
import HeroSection from '@/components/home/HeroSection'
import CategoryGrid from '@/components/home/CategoryGrid'
import TrendingServices from '@/components/home/TrendingServices'
import HowItWorks from '@/components/home/HowItWorks'
import WhyChooseUs from '@/components/home/WhyChooseUs'
import Testimonials from '@/components/home/Testimonials'
import AppDownload from '@/components/home/AppDownload'
import { CategoryWithSubs, ServiceWithDetails } from '@/types'
import { SITE_CONFIG } from '@/lib/config'

// ✅ UPDATE — Production-ready homepage
// Changes:
// 1. SpecialOffers → WhyChooseUs (fake coupon hata diya, real trust features)
// 2. Testimonials ab real DB data receive karega (fake reviews hata diye)
// 3. AppDownload section add kiya (Footer se pehle)
// 4. Testimonials conditional: agar 0 reviews hain to render hi nahi hoga
// 5. Review query: sirf verified reviews with non-null comments fetch honge

export const revalidate = 3600

export const metadata: Metadata = {
  title: SITE_CONFIG.name,
  description: SITE_CONFIG.tagline,
}

export default async function HomePage() {
  // Parallel queries — sab ek saath fetch hongi
  const [
    categories,
    trendingServices,
    completedBookings,
    totalCustomers,
    ratingAgg,
    verifiedProviders,
    testimonials, // ✅ NEW — real reviews fetch
  ] = await Promise.all([
    db.category.findMany({
      where: { isActive: true },
      include: {
        subCategories: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { sortOrder: 'asc' },
    }),
    db.service.findMany({
      where: { isTrending: true, isActive: true },
      include: {
        subCategory: {
          include: { category: true },
        },
      },
      take: 8,
      orderBy: { avgRating: 'desc' },
    }),
    db.booking.count({ where: { status: 'SERVICE_COMPLETED' } }),
    db.user.count({ where: { role: 'CUSTOMER' } }),
    db.review.aggregate({ _avg: { overallRating: true } }),
    db.provider.count({ where: { status: 'APPROVED' } }),
    // ✅ NEW — Real testimonials query
    // - Sirf verified reviews (isVerified: true)
    // - Sirf wo reviews jinke paas comment hai (comment not null)
    // - Latest pehle (createdAt desc)
    // - Max 8 reviews (homepage pe zyada nahi chahiye)
    db.review.findMany({
      where: {
        isVerified: true,
        comment: { not: null },
      },
      include: {
        user: { select: { name: true } },
        service: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 8,
    }),
  ])

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: SITE_CONFIG.name,
            url: SITE_CONFIG.url,
            potentialAction: {
              '@type': 'SearchAction',
              target: `${SITE_CONFIG.url}/services/search?q={search_term_string}`,
              'query-input': 'required name=search_term_string',
            },
          }),
        }}
      />

      <HeroSection
        categories={categories as CategoryWithSubs[]}
        stats={{
          completedBookings,
          totalCustomers,
          avgRating: ratingAgg._avg.overallRating || 0,
          verifiedProviders,
        }}
      />

      {/* ✅ limit={9} — homepage par sirf teaser, poori list /services par */}
      <CategoryGrid categories={categories as CategoryWithSubs[]} limit={9} />

      <TrendingServices services={trendingServices as unknown as ServiceWithDetails[]} />

      <HowItWorks />

      {/* ✅ REPLACED: SpecialOffers → WhyChooseUs (real trust features, no fake coupon) */}
      <WhyChooseUs />

      {/* ✅ REAL DATA: Testimonials ab DB se aayenge.
          Agar 0 reviews hain to Testimonials component internally null return karega. */}
      <Testimonials reviews={testimonials} cityName={SITE_CONFIG.city} />

      {/* ✅ NEW: App download section — Footer se just pehle */}
      <AppDownload />
    </>
  )
}