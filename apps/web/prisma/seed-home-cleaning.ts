import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function main() {
  console.log('🧹 Starting Home Cleaning fresh seed...')

  // Step 1: Delete all existing home cleaning data
  console.log('\n🗑️  Deleting old home cleaning data...')

  // Get home cleaning category
  const homeCleaning = await db.category.findUnique({
    where: { slug: 'home-cleaning' },
    include: {
      subCategories: {
        include: {
          services: true,
        },
      },
    },
  })

  if (homeCleaning) {
    // Delete all services under home cleaning (cascade will delete related data)
    for (const subCat of homeCleaning.subCategories) {
      for (const service of subCat.services) {
        await db.service.delete({ where: { id: service.id } })
      }
      await db.subCategory.delete({ where: { id: subCat.id } })
    }
    console.log('✅ Old home cleaning data deleted')
  }

  // Step 2: Helper function
  async function createService(
    subCategorySlug: string,
    data: {
      name: string; slug: string; description: string; image: string
      basePrice: number; priceType: 'FIXED' | 'STARTING_AT' | 'PER_SQFT' | 'CUSTOM_QUOTE'
      duration?: string; professionals?: number; avgRating?: number; totalReviews?: number
      guarantee?: string; isTrending?: boolean; isFeatured?: boolean
      inclusions: string[]; exclusions: string[]
      pricingTiers: { label: string; price: number; duration?: string }[]
      addOns?: { name: string; price: number; description?: string }[]
      faqs: { question: string; answer: string }[]
    }
  ) {
    const subCategory = await db.subCategory.findUnique({ where: { slug: subCategorySlug } })
    if (!subCategory) { console.error(`❌ SubCategory not found: ${subCategorySlug}`); return }

    const service = await db.service.create({
      data: {
        subCategoryId: subCategory.id, name: data.name, slug: data.slug,
        description: data.description, image: data.image, basePrice: data.basePrice,
        priceType: data.priceType, duration: data.duration || '', professionals: data.professionals || 1,
        avgRating: data.avgRating || 0, totalReviews: data.totalReviews || 0,
        guarantee: data.guarantee, isTrending: data.isTrending || false,
        isFeatured: data.isFeatured || false, isActive: true,
      },
    })

    for (let i = 0; i < data.inclusions.length; i++) {
      await db.serviceInclusion.create({ data: { serviceId: service.id, text: data.inclusions[i], sortOrder: i } })
    }
    for (let i = 0; i < data.exclusions.length; i++) {
      await db.serviceExclusion.create({ data: { serviceId: service.id, text: data.exclusions[i], sortOrder: i } })
    }
    for (let i = 0; i < data.pricingTiers.length; i++) {
      await db.servicePricing.create({ data: { serviceId: service.id, ...data.pricingTiers[i], sortOrder: i } })
    }
    if (data.addOns) {
      for (const addOn of data.addOns) {
        await db.serviceAddOn.create({ data: { serviceId: service.id, ...addOn } })
      }
    }
    for (let i = 0; i < data.faqs.length; i++) {
      await db.serviceFAQ.create({ data: { serviceId: service.id, ...data.faqs[i], sortOrder: i } })
    }

    console.log(`  ✅ ${data.slug}`)
  }

  // Step 3: Create fresh home cleaning data
  console.log('\n📦 Creating fresh Home Cleaning data...')

  // Sub-category 1.1: Bathroom Cleaning
  await db.subCategory.create({
    data: {
      categoryId: homeCleaning!.id,
      name: 'Bathroom Cleaning',
      slug: 'bathroom-cleaning',
      image: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=400&q=80',
      isActive: true,
    },
  })

  await createService('bathroom-cleaning', {
    name: 'Standard Bathroom Cleaning', slug: 'standard-bathroom-cleaning',
    description: 'Professional bathroom deep cleaning with eco-friendly products.',
    image: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=400&q=80',
    basePrice: 299, priceType: 'FIXED', duration: '45 mins - 1 hour', avgRating: 4.7, totalReviews: 234,
    guarantee: 'Re-cleaning if not satisfied',
    inclusions: ['Toilet scrubbing', 'Washbasin cleaning', 'Floor mopping', 'Mirror cleaning'],
    exclusions: ['Roof cleaning', 'Pipe unclogging'],
    pricingTiers: [{ label: 'Standard', price: 299 }],
    faqs: [{ question: 'Kitna time lagega?', answer: '45 minutes to 1 hour' }],
  })

  await createService('bathroom-cleaning', {
    name: 'Deep Bathroom Cleaning', slug: 'deep-bathroom-cleaning',
    description: 'Complete deep cleaning with anti-bacterial treatment.',
    image: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=400&q=80',
    basePrice: 499, priceType: 'FIXED', duration: '1 - 1.5 hours', avgRating: 4.8, totalReviews: 189,
    guarantee: 'Re-cleaning if not satisfied',
    inclusions: ['Everything in Standard +', 'Deep grout cleaning', 'Anti-bacterial treatment'],
    exclusions: ['Pipe unclogging'],
    pricingTiers: [{ label: 'Deep Clean', price: 499 }],
    faqs: [],
  })

  await createService('bathroom-cleaning', {
    name: 'Bathroom Sanitization Package', slug: 'bathroom-sanitization',
    description: 'Hospital-grade disinfection with 72-hour germ protection.',
    image: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=400&q=80',
    basePrice: 899, priceType: 'FIXED', duration: '2 - 2.5 hours', avgRating: 4.9, totalReviews: 156,
    guarantee: '72-hour germ protection',
    inclusions: ['Complete deep cleaning', 'Hospital-grade disinfectant', 'UV sanitization'],
    exclusions: [],
    pricingTiers: [{ label: 'Sanitization', price: 899 }],
    faqs: [],
  })

  // Sub-category 1.2: Kitchen Cleaning
  await db.subCategory.create({
    data: {
      categoryId: homeCleaning!.id,
      name: 'Kitchen Cleaning',
      slug: 'kitchen-cleaning',
      image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&q=80',
      isActive: true,
    },
  })

  await createService('kitchen-cleaning', {
    name: 'Standard Kitchen Cleaning', slug: 'standard-kitchen-cleaning',
    description: 'Professional kitchen cleaning service.',
    image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&q=80',
    basePrice: 399, priceType: 'FIXED', duration: '1 - 1.5 hours', avgRating: 4.6, totalReviews: 312,
    inclusions: ['Platform cleaning', 'Stove cleaning', 'Sink scrubbing', 'Floor mopping'],
    exclusions: ['Inside cabinet cleaning', 'Chimney cleaning'],
    pricingTiers: [{ label: 'Standard', price: 399 }],
    faqs: [],
  })

  await createService('kitchen-cleaning', {
    name: 'Deep Kitchen Cleaning', slug: 'deep-kitchen-cleaning',
    description: 'Complete deep kitchen cleaning with disinfection.',
    image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&q=80',
    basePrice: 799, priceType: 'FIXED', duration: '2 - 3 hours', avgRating: 4.8, totalReviews: 267,
    guarantee: 'Satisfaction guarantee',
    inclusions: ['Everything in Standard +', 'Inside cabinet cleaning', 'Complete disinfection'],
    exclusions: [],
    pricingTiers: [{ label: 'Deep Clean', price: 799 }],
    faqs: [],
  })

  await createService('kitchen-cleaning', {
    name: 'Kitchen + Chimney Combo', slug: 'kitchen-chimney-combo',
    description: 'Complete kitchen and chimney cleaning package.',
    image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&q=80',
    basePrice: 1299, priceType: 'FIXED', duration: '3 - 4 hours', avgRating: 4.9, totalReviews: 134,
    inclusions: ['Complete deep kitchen cleaning', 'Chimney internal cleaning', 'Oil collector cleaning'],
    exclusions: [],
    pricingTiers: [{ label: 'Combo', price: 1299 }],
    faqs: [],
  })

  // Sub-category 1.3: Full Home Cleaning
  await db.subCategory.create({
    data: {
      categoryId: homeCleaning!.id,
      name: 'Full Home Cleaning',
      slug: 'full-home-cleaning',
      image: 'https://images.unsplash.com/photo-1527515637462-cff94ead201a?w=400&q=80',
      isActive: true,
    },
  })

  await createService('full-home-cleaning', {
    name: 'Home Deep Cleaning', slug: 'home-deep-cleaning',
    description: 'Complete home deep cleaning service.',
    image: 'https://images.unsplash.com/photo-1527515637462-cff94ead201a?w=400&q=80',
    basePrice: 999, priceType: 'STARTING_AT', duration: '2 - 5 hours', avgRating: 4.7, isTrending: true,
    inclusions: ['All rooms cleaning', 'Kitchen cleaning', 'Bathroom cleaning', 'Floor vacuum + mopping'],
    exclusions: [],
    pricingTiers: [{ label: '1 BHK', price: 999 }, { label: '2 BHK', price: 1499 }, { label: '3 BHK', price: 1999 }],
    faqs: [],
  })

  await createService('full-home-cleaning', {
    name: 'Post-Construction Cleaning', slug: 'post-construction-cleaning',
    description: 'Specialized cleaning after construction work.',
    image: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=400&q=80',
    basePrice: 3999, priceType: 'STARTING_AT',
    inclusions: ['Debris removal', 'Deep cleaning all surfaces', 'Window cleaning'],
    exclusions: [],
    pricingTiers: [{ label: '1 BHK', price: 3999 }, { label: '2 BHK', price: 5999 }, { label: '3 BHK', price: 7999 }],
    faqs: [],
  })

  await createService('full-home-cleaning', {
    name: 'Move-in/Move-out Cleaning', slug: 'move-in-move-out-cleaning',
    description: 'Complete cleaning for moving in or out.',
    image: 'https://images.unsplash.com/photo-1527515637462-cff94ead201a?w=400&q=80',
    basePrice: 2999, priceType: 'STARTING_AT',
    inclusions: ['Complete home cleaning', 'Appliance cleaning', 'Cabinet cleaning'],
    exclusions: [],
    pricingTiers: [{ label: '1 BHK', price: 2999 }, { label: '2 BHK', price: 4499 }, { label: '3 BHK', price: 5999 }],
    faqs: [],
  })

  // Sub-category 1.4: Sofa & Upholstery
  await db.subCategory.create({
    data: {
      categoryId: homeCleaning!.id,
      name: 'Sofa & Upholstery',
      slug: 'sofa-upholstery',
      image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&q=80',
      isActive: true,
    },
  })

  await createService('sofa-upholstery', {
    name: 'Sofa Cleaning', slug: 'sofa-cleaning',
    description: 'Professional sofa cleaning service.',
    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&q=80',
    basePrice: 299, priceType: 'STARTING_AT', avgRating: 4.8, guarantee: 'Stain removal guarantee',
    inclusions: ['Deep cleaning', 'Stain removal', 'Sanitization'],
    exclusions: [],
    pricingTiers: [{ label: '1 Seater', price: 299 }, { label: '2 Seater', price: 499 }, { label: '3 Seater', price: 699 }, { label: 'L-Shape', price: 1199 }],
    faqs: [],
  })

  await createService('sofa-upholstery', {
    name: 'Carpet & Rug Cleaning', slug: 'carpet-rug-cleaning',
    description: 'Professional carpet and rug cleaning.',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80',
    basePrice: 499, priceType: 'STARTING_AT',
    inclusions: ['Deep cleaning', 'Stain removal'],
    exclusions: [],
    pricingTiers: [{ label: 'Small Rug', price: 499 }, { label: 'Medium Carpet', price: 799 }, { label: 'Large Carpet', price: 1199 }],
    faqs: [],
  })

  await createService('sofa-upholstery', {
    name: 'Mattress Cleaning', slug: 'mattress-cleaning',
    description: 'Deep mattress cleaning and sanitization.',
    image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&q=80',
    basePrice: 599, priceType: 'STARTING_AT', avgRating: 4.9, guarantee: 'Dust mite elimination guarantee',
    inclusions: ['Deep cleaning', 'Dust mite removal', 'Sanitization'],
    exclusions: [],
    pricingTiers: [{ label: 'Single', price: 599 }, { label: 'Double', price: 799 }, { label: 'Queen/King', price: 999 }],
    faqs: [],
  })

  // Sub-category 1.5: Water Tank Cleaning
  await db.subCategory.create({
    data: {
      categoryId: homeCleaning!.id,
      name: 'Water Tank Cleaning',
      slug: 'water-tank-cleaning',
      image: 'https://images.unsplash.com/photo-1584432743501-7d5c27a39189?w=400&q=80',
      isActive: true,
    },
  })

  await createService('water-tank-cleaning', {
    name: 'Underground Tank Cleaning', slug: 'underground-tank-cleaning',
    description: 'Professional underground water tank cleaning.',
    image: 'https://images.unsplash.com/photo-1584432743501-7d5c27a39189?w=400&q=80',
    basePrice: 799, priceType: 'STARTING_AT', avgRating: 4.8,
    inclusions: ['Complete cleaning', 'Sludge removal', 'Disinfection'],
    exclusions: [],
    pricingTiers: [{ label: 'Up to 500L', price: 799 }, { label: '500-1000L', price: 1199 }, { label: '1000-2000L', price: 1799 }],
    faqs: [],
  })

  await createService('water-tank-cleaning', {
    name: 'Overhead Tank Cleaning', slug: 'overhead-tank-cleaning',
    description: 'Overhead water tank cleaning service.',
    image: 'https://images.unsplash.com/photo-1584432743501-7d5c27a39189?w=400&q=80',
    basePrice: 599, priceType: 'STARTING_AT',
    inclusions: ['Complete cleaning', 'Disinfection'],
    exclusions: [],
    pricingTiers: [{ label: 'Up to 500L', price: 599 }, { label: '500-1000L', price: 899 }, { label: '1000L+', price: 1299 }],
    faqs: [],
  })

  console.log('\n🎉 Home Cleaning fresh seed complete!')
}

main()
  .catch((e) => {
    console.error('❌', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })