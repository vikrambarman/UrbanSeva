import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function main() {
  console.log('🌱 Starting Complete Phase 4 Seed...')

  // ═══════════════════════════════════════════
  // PHASE 1-3 DATA
  // ═══════════════════════════════════════════

  await db.user.upsert({
    where: { phone: '9999999999' },
    update: {},
    create: { phone: '9999999999', name: 'Admin', role: 'ADMIN', isVerified: true, isActive: true },
  })

  const plans = [
    { id: 'plan-basic', name: 'Basic', price: 0, duration: 30, discount: 0, features: ['Standard booking', 'Email support'] },
    { id: 'plan-plus', name: 'Plus', price: 99, duration: 30, discount: 10, features: ['10% discount', 'Priority booking'] },
    { id: 'plan-premium', name: 'Premium', price: 199, duration: 30, discount: 15, features: ['15% discount', '24/7 support'] },
  ]
  for (const p of plans) {
    await db.subscriptionPlan.upsert({ where: { id: p.id }, update: {}, create: { ...p, isActive: true } })
  }

  const settings = [
    { key: 'platform_commission', value: '20' },
    { key: 'min_payout_amount', value: '500' },
    { key: 'otp_expiry_minutes', value: '5' },
    { key: 'support_phone', value: '9876543210' },
    { key: 'app_name', value: 'ServiceApp' },
  ]
  for (const s of settings) {
    await db.appSetting.upsert({ where: { key: s.key }, update: { value: s.value }, create: { ...s, description: '' } })
  }

  const coupons = [
    { code: 'FIRST50', description: '50% OFF (max ₹200)', discountType: 'PERCENTAGE' as const, discountValue: 50, minOrderAmount: 200, maxDiscount: 200, usageLimit: 1000, perUserLimit: 1, validFrom: new Date(), validTill: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), isActive: true, applicableCategories: [] },
    { code: 'WELCOME100', description: '₹100 flat discount', discountType: 'FIXED' as const, discountValue: 100, minOrderAmount: 500, maxDiscount: 100, usageLimit: 500, perUserLimit: 1, validFrom: new Date(), validTill: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), isActive: true, applicableCategories: [] },
  ]
  for (const c of coupons) {
    await db.coupon.upsert({ where: { code: c.code }, update: {}, create: c })
  }
  console.log('✅ Phase 1-3 data created')

  // ═══════════════════════════════════════════
  // CATEGORIES
  // ═══════════════════════════════════════════

  const categories = [
    { name: 'Home Cleaning Services', slug: 'home-cleaning', icon: '🧹', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80', sortOrder: 1 },
    { name: 'Electrical Services', slug: 'electrical', icon: '⚡', image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&q=80', sortOrder: 2 },
    { name: 'Plumbing Services', slug: 'plumbing', icon: '🔧', image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d28?w=400&q=80', sortOrder: 3 },
    { name: 'AC & Appliance Services', slug: 'ac-appliance', icon: '❄️', image: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400&q=80', sortOrder: 4 },
    { name: 'Painting Services', slug: 'painting', icon: '🎨', image: 'https://images.unsplash.com/photo-1562259929-b4e1fd3aef09?w=400&q=80', sortOrder: 5 },
    { name: 'Pest Control Services', slug: 'pest-control', icon: '🐛', image: 'https://images.unsplash.com/photo-1632163565874-b7a3a82b1527?w=400&q=80', sortOrder: 6 },
    { name: 'Beauty & Wellness', slug: 'beauty-wellness', icon: '💆', image: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=400&q=80', sortOrder: 7 },
    { name: 'Carpentry Services', slug: 'carpentry', icon: '🪚', image: 'https://images.unsplash.com/photo-1566837945700-30057527ade0?w=400&q=80', sortOrder: 8 },
    { name: 'Home Improvement', slug: 'home-improvement', icon: '🏠', image: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=400&q=80', sortOrder: 9 },
    { name: 'Vehicle Services', slug: 'vehicle-services', icon: '🚗', image: 'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?w=400&q=80', sortOrder: 10 },
    { name: 'Property Services', slug: 'property-services', icon: '🏢', image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&q=80', sortOrder: 11 },
    { name: 'Education & Tuition', slug: 'education-tuition', icon: '📚', image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&q=80', sortOrder: 12 },
    { name: 'Healthcare at Home', slug: 'healthcare', icon: '🏥', image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&q=80', sortOrder: 13 },
    { name: 'Pet Care Services', slug: 'pet-care', icon: '🐾', image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&q=80', sortOrder: 14 },
    { name: 'Events & Occasions', slug: 'events-occasions', icon: '🎉', image: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400&q=80', sortOrder: 15 },
    { name: 'Packers & Movers', slug: 'packers-movers', icon: '📦', image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400&q=80', sortOrder: 16 },
  ]

  for (const cat of categories) {
    await db.category.upsert({ where: { slug: cat.slug }, update: { image: cat.image }, create: { ...cat, description: '', isActive: true } })
  }
  console.log('✅ 16 Categories created')

  // ═══════════════════════════════════════════
  // HELPER FUNCTIONS
  // ═══════════════════════════════════════════

  async function createSubCategory(categorySlug: string, data: { name: string; slug: string; image: string }) {
    const category = await db.category.findUnique({ where: { slug: categorySlug } })
    if (!category) throw new Error(`Category not found: ${categorySlug}`)
    
    await db.subCategory.upsert({
      where: { slug: data.slug },
      update: {},
      create: { categoryId: category.id, ...data, isActive: true },
    })
  }

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

    const service = await db.service.upsert({
      where: { slug: data.slug },
      update: {},
      create: {
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

  // ═══════════════════════════════════════════
  // CATEGORY 1: HOME CLEANING
  // ═══════════════════════════════════════════

  console.log('\n📦 Category 1: Home Cleaning')

  await createSubCategory('home-cleaning', { name: 'Bathroom Cleaning', slug: 'bathroom-cleaning', image: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=400&q=80' })
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

  await createSubCategory('home-cleaning', { name: 'Kitchen Cleaning', slug: 'kitchen-cleaning', image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&q=80' })
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

  await createSubCategory('home-cleaning', { name: 'Full Home Cleaning', slug: 'full-home-cleaning', image: 'https://images.unsplash.com/photo-1527515637462-cff94ead201a?w=400&q=80' })
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

  await createSubCategory('home-cleaning', { name: 'Sofa & Upholstery', slug: 'sofa-upholstery', image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&q=80' })
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

  await createSubCategory('home-cleaning', { name: 'Water Tank Cleaning', slug: 'water-tank-cleaning', image: 'https://images.unsplash.com/photo-1584432743501-7d5c27a39189?w=400&q=80' })
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

  console.log('✅ Category 1 Complete')

  // ═══════════════════════════════════════════
  // CATEGORY 2: ELECTRICAL
  // ═══════════════════════════════════════════

  console.log('\n📦 Category 2: Electrical')

  await createSubCategory('electrical', { name: 'Basic Electrical Work', slug: 'basic-electrical', image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&q=80' })
  await createService('basic-electrical', {
    name: 'Switch & Switchboard Services', slug: 'switch-switchboard',
    description: 'Switch and switchboard installation and repair.',
    image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&q=80',
    basePrice: 150, priceType: 'STARTING_AT', avgRating: 4.7, guarantee: '30-day work guarantee',
    inclusions: ['Switch replacement', 'Switchboard installation', 'Socket installation'],
    exclusions: [],
    pricingTiers: [{ label: 'Single switch', price: 150 }, { label: 'Double switch', price: 200 }, { label: 'Switchboard install', price: 350 }, { label: 'Socket install', price: 200 }],
    faqs: [],
  })
  await createService('basic-electrical', {
    name: 'Light & Fan Installation', slug: 'light-fan-installation',
    description: 'Light and fan installation service.',
    image: 'https://images.unsplash.com/photo-1524484485831-a92ffc0de03f?w=400&q=80',
    basePrice: 199, priceType: 'STARTING_AT', avgRating: 4.8, isTrending: true, guarantee: '30-day guarantee',
    inclusions: ['Ceiling fan install', 'Light installation', 'Fan balancing'],
    exclusions: [],
    pricingTiers: [{ label: 'Ceiling fan install', price: 299 }, { label: 'Ceiling fan replace', price: 249 }, { label: 'Simple ceiling light', price: 199 }, { label: 'Exhaust fan', price: 299 }],
    faqs: [],
  })
  await createService('basic-electrical', {
    name: 'MCB & Electrical Panel', slug: 'mcb-electrical-panel',
    description: 'MCB and electrical panel services.',
    image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&q=80',
    basePrice: 350, priceType: 'STARTING_AT', avgRating: 4.9, guarantee: '90-day guarantee',
    inclusions: ['MCB installation', 'Panel repair', 'Earthing check'],
    exclusions: [],
    pricingTiers: [{ label: 'Single MCB', price: 350 }, { label: 'MCB board 8-way', price: 1500 }, { label: 'ELCB', price: 800 }],
    faqs: [],
  })

  await createSubCategory('electrical', { name: 'Wiring & Cabling', slug: 'wiring-cabling', image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&q=80' })
  await createService('wiring-cabling', {
    name: 'Room Wiring', slug: 'room-wiring',
    description: 'Room wiring and rewiring service.',
    image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&q=80',
    basePrice: 450, priceType: 'STARTING_AT', guarantee: '1-year wiring guarantee',
    inclusions: ['New wiring', 'Rewiring', 'Extension fitting'],
    exclusions: [],
    pricingTiers: [{ label: 'Per point (new)', price: 450 }, { label: 'Room rewiring', price: 1500 }, { label: 'Extension fitting', price: 299 }],
    faqs: [],
  })
  await createService('wiring-cabling', {
    name: 'Outdoor & Commercial Wiring', slug: 'outdoor-commercial-wiring',
    description: 'Outdoor and commercial wiring service.',
    image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&q=80',
    basePrice: 0, priceType: 'CUSTOM_QUOTE',
    inclusions: ['Custom wiring solutions'],
    exclusions: [],
    pricingTiers: [],
    faqs: [],
  })

  await createSubCategory('electrical', { name: 'Inverter & Solar', slug: 'inverter-solar', image: 'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=400&q=80' })
  await createService('inverter-solar', {
    name: 'Inverter/UPS Services', slug: 'inverter-ups-services',
    description: 'Inverter and UPS repair and installation.',
    image: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=400&q=80',
    basePrice: 199, priceType: 'STARTING_AT', guarantee: '30-day repair guarantee',
    inclusions: ['Battery terminal cleaning', 'Inverter repair', 'Installation'],
    exclusions: [],
    pricingTiers: [{ label: 'Battery terminal cleaning', price: 199 }, { label: 'Inverter repair (basic)', price: 399 }, { label: 'Inverter installation', price: 599 }],
    faqs: [],
  })
  await createService('inverter-solar', {
    name: 'Solar Panel Services', slug: 'solar-panel-services',
    description: 'Solar panel cleaning and installation.',
    image: 'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=400&q=80',
    basePrice: 100, priceType: 'STARTING_AT',
    inclusions: ['Panel cleaning', 'System inspection'],
    exclusions: [],
    pricingTiers: [{ label: 'Cleaning (per panel)', price: 100 }, { label: 'System inspection', price: 599 }],
    faqs: [],
  })

  await createSubCategory('electrical', { name: 'CSPDCL Services', slug: 'cspdcl-services', image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&q=80' })
  await createService('cspdcl-services', {
    name: 'New Connection Assistance', slug: 'new-electricity-connection',
    description: 'New electricity connection assistance.',
    image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&q=80',
    basePrice: 999, priceType: 'FIXED', duration: '7-15 working days', avgRating: 4.8,
    inclusions: ['Application assistance', 'Documentation', 'Follow-up'],
    exclusions: ['Govt charges extra'],
    pricingTiers: [{ label: 'New Connection', price: 999 }],
    faqs: [],
  })
  await createService('cspdcl-services', {
    name: 'Load Enhancement', slug: 'load-enhancement',
    description: 'Electricity load enhancement service.',
    image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&q=80',
    basePrice: 799, priceType: 'FIXED',
    inclusions: ['Application', 'Documentation'],
    exclusions: ['Govt charges'],
    pricingTiers: [{ label: 'Load Enhancement', price: 799 }],
    faqs: [],
  })
  await createService('cspdcl-services', {
    name: 'Meter Related Services', slug: 'meter-services',
    description: 'Electricity meter related services.',
    image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&q=80',
    basePrice: 499, priceType: 'STARTING_AT',
    inclusions: ['Meter reading dispute', 'Meter shift', 'Defective meter'],
    exclusions: [],
    pricingTiers: [{ label: 'Meter reading dispute', price: 499 }, { label: 'Meter shift', price: 699 }, { label: 'Defective meter', price: 499 }],
    faqs: [],
  })
  await createService('cspdcl-services', {
    name: 'Bill Payment Assistance', slug: 'bill-payment-assistance',
    description: 'Electricity bill payment assistance.',
    image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&q=80',
    basePrice: 49, priceType: 'FIXED', avgRating: 4.9,
    inclusions: ['Bill payment', 'Receipt'],
    exclusions: [],
    pricingTiers: [{ label: 'Bill Payment', price: 49 }],
    faqs: [],
  })

  console.log('✅ Category 2 Complete')

  // ═══════════════════════════════════════════
  // CATEGORY 3: PLUMBING
  // ═══════════════════════════════════════════

  console.log('\n📦 Category 3: Plumbing')

  await createSubCategory('plumbing', { name: 'Leakage & Repair', slug: 'leakage-repair', image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d28?w=400&q=80' })
  await createService('leakage-repair', {
    name: 'Pipe Leak Repair', slug: 'pipe-leak-repair',
    description: 'Pipe leak repair service.',
    image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d28?w=400&q=80',
    basePrice: 199, priceType: 'STARTING_AT', guarantee: '30-day repair guarantee',
    inclusions: ['Tap leakage', 'Surface pipe joint', 'Shower repair'],
    exclusions: [],
    pricingTiers: [{ label: 'Tap leakage', price: 199 }, { label: 'Surface pipe joint', price: 299 }, { label: 'Shower repair', price: 399 }],
    faqs: [],
  })
  await createService('leakage-repair', {
    name: 'Tap & Fitting Services', slug: 'tap-fitting-services',
    description: 'Tap and fitting installation and repair.',
    image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d28?w=400&q=80',
    basePrice: 149, priceType: 'STARTING_AT',
    inclusions: ['Washer replacement', 'Tap install', 'Tap replacement'],
    exclusions: [],
    pricingTiers: [{ label: 'Washer replacement', price: 149 }, { label: 'Normal tap install', price: 199 }, { label: 'Tap replacement', price: 250 }],
    faqs: [],
  })

  await createSubCategory('plumbing', { name: 'Drainage & Blockage', slug: 'drainage-blockage', image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d28?w=400&q=80' })
  await createService('drainage-blockage', {
    name: 'Drain Unblocking', slug: 'drain-unblocking',
    description: 'Drain unblocking service.',
    image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d28?w=400&q=80',
    basePrice: 299, priceType: 'STARTING_AT', guarantee: '24-hour clearance guarantee',
    inclusions: ['Washbasin/Sink', 'Bathroom floor drain', 'Toilet unblocking'],
    exclusions: [],
    pricingTiers: [{ label: 'Washbasin/Sink', price: 299 }, { label: 'Bathroom floor drain', price: 399 }, { label: 'Toilet (basic)', price: 499 }],
    faqs: [],
  })
  await createService('drainage-blockage', {
    name: 'Toilet & Sanitary Services', slug: 'toilet-sanitary',
    description: 'Toilet and sanitary services.',
    image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d28?w=400&q=80',
    basePrice: 249, priceType: 'STARTING_AT',
    inclusions: ['Flush valve', 'Flush tank repair', 'Jet spray'],
    exclusions: [],
    pricingTiers: [{ label: 'Flush valve', price: 249 }, { label: 'Flush tank repair', price: 349 }, { label: 'Jet spray', price: 299 }],
    faqs: [],
  })

  await createSubCategory('plumbing', { name: 'Water Pump Services', slug: 'water-pump', image: 'https://images.unsplash.com/photo-1584432743501-7d5c27a39189?w=400&q=80' })
  await createService('water-pump', {
    name: 'Pump Installation & Repair', slug: 'pump-installation-repair',
    description: 'Water pump installation and repair.',
    image: 'https://images.unsplash.com/photo-1584432743501-7d5c27a39189?w=400&q=80',
    basePrice: 399, priceType: 'STARTING_AT', guarantee: '60-day repair guarantee',
    inclusions: ['Pump repair', 'Bearing replacement', 'Pump installation'],
    exclusions: [],
    pricingTiers: [{ label: 'Starter repair', price: 399 }, { label: 'Basic pump repair', price: 499 }, { label: 'Pump installation', price: 899 }],
    faqs: [],
  })

  await createSubCategory('plumbing', { name: 'Waterproofing', slug: 'waterproofing', image: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=400&q=80' })
  await createService('waterproofing', {
    name: 'Waterproofing Treatment', slug: 'waterproofing-treatment',
    description: 'Waterproofing treatment service.',
    image: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=400&q=80',
    basePrice: 45, priceType: 'PER_SQFT', guarantee: '3-year guarantee',
    inclusions: ['Bathroom floor', 'Terrace', 'Balcony', 'External wall'],
    exclusions: [],
    pricingTiers: [{ label: 'Bathroom floor (per sqft)', price: 45 }, { label: 'Terrace (per sqft)', price: 55 }, { label: 'External wall (per sqft)', price: 60 }],
    faqs: [],
  })

  console.log('✅ Category 3 Complete')

  // ═══════════════════════════════════════════
  // CATEGORY 4: AC & APPLIANCE
  // ═══════════════════════════════════════════

  console.log('\n📦 Category 4: AC & Appliance')

  await createSubCategory('ac-appliance', { name: 'AC Services', slug: 'ac-services', image: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400&q=80' })
  await createService('ac-services', {
    name: 'AC Regular Service', slug: 'ac-regular-service',
    description: 'AC regular service and maintenance.',
    image: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400&q=80',
    basePrice: 499, priceType: 'STARTING_AT', avgRating: 4.7, isTrending: true, guarantee: '30-day service guarantee',
    inclusions: ['Filter cleaning', 'Gas check', 'General service'],
    exclusions: [],
    pricingTiers: [{ label: '1 Ton', price: 499 }, { label: '1.5 Ton', price: 599 }, { label: '2 Ton', price: 699 }],
    faqs: [],
  })
  await createService('ac-services', {
    name: 'AC Deep Service', slug: 'ac-deep-service',
    description: 'AC deep service with complete cleaning.',
    image: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400&q=80',
    basePrice: 799, priceType: 'STARTING_AT', avgRating: 4.9, guarantee: '60-day guarantee',
    inclusions: ['Complete cleaning', 'Deep service', 'Gas check'],
    exclusions: [],
    pricingTiers: [{ label: '1 Ton', price: 799 }, { label: '1.5 Ton', price: 999 }, { label: '2 Ton', price: 1199 }],
    addOns: [{ name: 'Gas refill R32', price: 1800 }],
    faqs: [],
  })
  await createService('ac-services', {
    name: 'AC Installation', slug: 'ac-installation',
    description: 'AC installation and uninstallation.',
    image: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400&q=80',
    basePrice: 999, priceType: 'STARTING_AT', guarantee: '90-day guarantee',
    inclusions: ['Installation', 'Uninstallation', 'AC shift'],
    exclusions: [],
    pricingTiers: [{ label: 'Window AC', price: 999 }, { label: 'Split AC', price: 1299 }, { label: 'Uninstallation', price: 699 }],
    addOns: [{ name: 'Copper pipe (per foot)', price: 120 }, { name: 'Stabilizer installation', price: 299 }],
    faqs: [],
  })
  await createService('ac-services', {
    name: 'AC Repair', slug: 'ac-repair',
    description: 'AC repair service.',
    image: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400&q=80',
    basePrice: 299, priceType: 'STARTING_AT', guarantee: '90-day repair guarantee',
    inclusions: ['Inspection', 'Gas filling', 'Fan motor repair'],
    exclusions: [],
    pricingTiers: [{ label: 'Inspection', price: 299 }, { label: 'Gas filling R32', price: 1800 }, { label: 'Fan motor', price: 1500 }],
    faqs: [],
  })

  await createSubCategory('ac-appliance', { name: 'Washing Machine', slug: 'washing-machine', image: 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=400&q=80' })
  await createService('washing-machine', {
    name: 'Washing Machine Repair', slug: 'washing-machine-repair',
    description: 'Washing machine repair service.',
    image: 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=400&q=80',
    basePrice: 299, priceType: 'STARTING_AT', guarantee: '90-day guarantee',
    inclusions: ['Inspection', 'Belt replacement', 'Pump replacement'],
    exclusions: [],
    pricingTiers: [{ label: 'Inspection', price: 299 }, { label: 'Belt replacement', price: 399 }, { label: 'Pump replacement', price: 799 }],
    faqs: [],
  })
  await createService('washing-machine', {
    name: 'Drum Cleaning', slug: 'washing-machine-drum-cleaning',
    description: 'Washing machine drum cleaning.',
    image: 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=400&q=80',
    basePrice: 499, priceType: 'STARTING_AT',
    inclusions: ['Drum cleaning', 'Sanitization'],
    exclusions: [],
    pricingTiers: [{ label: 'Top Load', price: 499 }, { label: 'Front Load', price: 699 }],
    faqs: [],
  })

  await createSubCategory('ac-appliance', { name: 'Refrigerator', slug: 'refrigerator', image: 'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=400&q=80' })
  await createService('refrigerator', {
    name: 'Refrigerator Repair', slug: 'refrigerator-repair',
    description: 'Refrigerator repair service.',
    image: 'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=400&q=80',
    basePrice: 299, priceType: 'STARTING_AT', guarantee: '90-day guarantee',
    inclusions: ['Inspection', 'Thermostat', 'Door seal'],
    exclusions: [],
    pricingTiers: [{ label: 'Inspection', price: 299 }, { label: 'Thermostat', price: 499 }, { label: 'Gas filling', price: 2000 }],
    faqs: [],
  })
  await createService('refrigerator', {
    name: 'Refrigerator Cleaning', slug: 'refrigerator-deep-cleaning',
    description: 'Refrigerator deep cleaning.',
    image: 'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=400&q=80',
    basePrice: 599, priceType: 'STARTING_AT',
    inclusions: ['Complete cleaning', 'Sanitization'],
    exclusions: [],
    pricingTiers: [{ label: 'Single door', price: 599 }, { label: 'Double door', price: 799 }, { label: 'Side-by-side', price: 999 }],
    faqs: [],
  })

  await createSubCategory('ac-appliance', { name: 'Other Appliances', slug: 'other-appliances', image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&q=80' })
  await createService('other-appliances', {
    name: 'Microwave Repair', slug: 'microwave-repair',
    description: 'Microwave repair service.',
    image: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400&q=80',
    basePrice: 249, priceType: 'STARTING_AT',
    inclusions: ['Inspection', 'Door spring', 'Turntable motor'],
    exclusions: [],
    pricingTiers: [{ label: 'Inspection', price: 249 }, { label: 'Door spring', price: 399 }, { label: 'Turntable motor', price: 499 }],
    faqs: [],
  })
  await createService('other-appliances', {
    name: 'Geyser Services', slug: 'geyser-services',
    description: 'Geyser service and repair.',
    image: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400&q=80',
    basePrice: 399, priceType: 'STARTING_AT', guarantee: '30-day guarantee',
    inclusions: ['Annual service', 'Repair', 'Installation'],
    exclusions: [],
    pricingTiers: [{ label: 'Annual service', price: 399 }, { label: 'Repair', price: 399 }, { label: 'Installation', price: 499 }],
    faqs: [],
  })
  await createService('other-appliances', {
    name: 'Water Purifier (RO)', slug: 'water-purifier-ro',
    description: 'Water purifier (RO) service.',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80',
    basePrice: 299, priceType: 'STARTING_AT',
    inclusions: ['Tank cleaning', 'UV lamp', 'Membrane'],
    exclusions: [],
    pricingTiers: [{ label: 'Tank cleaning', price: 299 }, { label: 'UV lamp', price: 299 }, { label: 'Full service', price: 699 }],
    faqs: [],
  })
  await createService('other-appliances', {
    name: 'Chimney & Hob', slug: 'chimney-hob-services',
    description: 'Chimney and hob service.',
    image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&q=80',
    basePrice: 499, priceType: 'STARTING_AT',
    inclusions: ['Hob service', 'Filter replacement', 'Chimney cleaning'],
    exclusions: [],
    pricingTiers: [{ label: 'Hob service', price: 499 }, { label: 'Filter replacement', price: 299 }, { label: 'Chimney cleaning', price: 699 }],
    faqs: [],
  })

  console.log('✅ Category 4 Complete')

  // ═══════════════════════════════════════════
  // CATEGORY 5: PAINTING
  // ═══════════════════════════════════════════

  console.log('\n📦 Category 5: Painting')

  await createSubCategory('painting', { name: 'Interior Painting', slug: 'interior-painting', image: 'https://images.unsplash.com/photo-1562259929-b4e1fd3aef09?w=400&q=80' })
  await createService('interior-painting', {
    name: 'Full Room Painting', slug: 'full-room-painting',
    description: 'Complete room painting service with quality paints.',
    image: 'https://images.unsplash.com/photo-1562259929-b4e1fd3aef09?w=400&q=80',
    basePrice: 1500, priceType: 'STARTING_AT', avgRating: 4.7, isTrending: true, guarantee: '1-year guarantee',
    inclusions: ['Wall preparation', 'Primer application', '2 coats paint', 'Cleanup'],
    exclusions: ['Texture work', 'Stencil design'],
    pricingTiers: [{ label: 'Whitewash (1 room)', price: 1500 }, { label: 'Emulsion (1 room)', price: 3500 }, { label: 'Premium emulsion', price: 5000 }, { label: 'Luxury finish', price: 7000 }],
    faqs: [],
  })
  await createService('interior-painting', {
    name: 'Waterproof Painting', slug: 'waterproof-painting',
    description: 'Waterproof painting for walls.',
    image: 'https://images.unsplash.com/photo-1562259929-b4e1fd3aef09?w=400&q=80',
    basePrice: 35, priceType: 'PER_SQFT', guarantee: '3-year guarantee',
    inclusions: ['Waterproof primer', '2 coats paint'],
    exclusions: [],
    pricingTiers: [{ label: 'Per sqft', price: 35 }],
    faqs: [],
  })

  await createSubCategory('painting', { name: 'Exterior Painting', slug: 'exterior-painting', image: 'https://images.unsplash.com/photo-1562259929-b4e1fd3aef09?w=400&q=80' })
  await createService('exterior-painting', {
    name: 'Exterior Wall Painting', slug: 'exterior-wall-painting',
    description: 'Exterior wall painting with weather-resistant paints.',
    image: 'https://images.unsplash.com/photo-1562259929-b4e1fd3aef09?w=400&q=80',
    basePrice: 22, priceType: 'PER_SQFT', guarantee: '2-year guarantee',
    inclusions: ['Wall preparation', 'Weather shield paint', '2 coats'],
    exclusions: [],
    pricingTiers: [{ label: 'Basic (per sqft)', price: 22 }, { label: 'Weather shield', price: 35 }, { label: 'Apex premium', price: 55 }],
    faqs: [],
  })

  await createSubCategory('painting', { name: 'Wood & Metal Painting', slug: 'wood-metal-painting', image: 'https://images.unsplash.com/photo-1566837945700-30057527ade0?w=400&q=80' })
  await createService('wood-metal-painting', {
    name: 'Wood & Metal Painting Service', slug: 'wood-metal-painting-service',
    description: 'Wood and metal painting service.',
    image: 'https://images.unsplash.com/photo-1566837945700-30057527ade0?w=400&q=80',
    basePrice: 199, priceType: 'STARTING_AT',
    inclusions: ['Surface preparation', 'Primer', '2 coats paint'],
    exclusions: [],
    pricingTiers: [{ label: 'Furniture polish', price: 199 }, { label: 'Window', price: 249 }, { label: 'Door (per side)', price: 349 }, { label: 'Anti-rust metal', price: 299 }],
    faqs: [],
  })

  await createSubCategory('painting', { name: 'Specialized Painting', slug: 'specialized-painting', image: 'https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=400&q=80' })
  await createService('specialized-painting', {
    name: 'Designer Painting', slug: 'designer-painting',
    description: 'Designer and texture painting service.',
    image: 'https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=400&q=80',
    basePrice: 0, priceType: 'CUSTOM_QUOTE', avgRating: 4.9,
    inclusions: ['Custom designs', 'Texture work', 'Stencil work'],
    exclusions: [],
    pricingTiers: [],
    faqs: [],
  })

  console.log('✅ Category 5 Complete')

  // ═══════════════════════════════════════════
  // CATEGORY 6: PEST CONTROL
  // ═══════════════════════════════════════════

  console.log('\n📦 Category 6: Pest Control')

  await createSubCategory('pest-control', { name: 'Cockroach Control', slug: 'cockroach-control', image: 'https://images.unsplash.com/photo-1632163565874-b7a3a82b1527?w=400&q=80' })
  await createService('cockroach-control', {
    name: 'Gel Treatment', slug: 'cockroach-gel-treatment',
    description: 'Cockroach gel treatment service.',
    image: 'https://images.unsplash.com/photo-1632163565874-b7a3a82b1527?w=400&q=80',
    basePrice: 799, priceType: 'STARTING_AT', avgRating: 4.8, guarantee: '3-month guarantee',
    inclusions: ['Gel application', 'Crack treatment', 'Follow-up'],
    exclusions: [],
    pricingTiers: [{ label: '1 BHK', price: 799 }, { label: '2 BHK', price: 999 }, { label: '3 BHK', price: 1299 }],
    faqs: [],
  })
  await createService('cockroach-control', {
    name: 'Spray Treatment', slug: 'cockroach-spray-treatment',
    description: 'Cockroach spray treatment.',
    image: 'https://images.unsplash.com/photo-1632163565874-b7a3a82b1527?w=400&q=80',
    basePrice: 599, priceType: 'STARTING_AT', guarantee: '1-month guarantee',
    inclusions: ['Spray treatment', 'All areas coverage'],
    exclusions: [],
    pricingTiers: [{ label: '1 BHK', price: 599 }, { label: '2 BHK', price: 799 }, { label: '3 BHK', price: 999 }],
    faqs: [],
  })

  await createSubCategory('pest-control', { name: 'Termite Control', slug: 'termite-control', image: 'https://images.unsplash.com/photo-1632163565874-b7a3a82b1527?w=400&q=80' })
  await createService('termite-control', {
    name: 'Anti-Termite Post-Construction', slug: 'anti-termite-post-construction',
    description: 'Post-construction termite treatment.',
    image: 'https://images.unsplash.com/photo-1632163565874-b7a3a82b1527?w=400&q=80',
    basePrice: 2499, priceType: 'STARTING_AT', guarantee: '5-year guarantee',
    inclusions: ['Drilling', 'Chemical injection', 'Sealing'],
    exclusions: [],
    pricingTiers: [{ label: '1 BHK', price: 2499 }, { label: '2 BHK', price: 3499 }, { label: '3 BHK', price: 4499 }],
    faqs: [],
  })
  await createService('termite-control', {
    name: 'Anti-Termite Pre-Construction', slug: 'anti-termite-pre-construction',
    description: 'Pre-construction termite treatment.',
    image: 'https://images.unsplash.com/photo-1632163565874-b7a3a82b1527?w=400&q=80',
    basePrice: 0, priceType: 'CUSTOM_QUOTE', guarantee: '10-year guarantee',
    inclusions: ['Soil treatment', 'Foundation treatment'],
    exclusions: [],
    pricingTiers: [],
    faqs: [],
  })

  await createSubCategory('pest-control', { name: 'Mosquito Control', slug: 'mosquito-control', image: 'https://images.unsplash.com/photo-1632163565874-b7a3a82b1527?w=400&q=80' })
  await createService('mosquito-control', {
    name: 'Mosquito Treatment', slug: 'mosquito-treatment',
    description: 'Mosquito control treatment.',
    image: 'https://images.unsplash.com/photo-1632163565874-b7a3a82b1527?w=400&q=80',
    basePrice: 499, priceType: 'STARTING_AT', guarantee: '15-day guarantee',
    inclusions: ['Spray treatment', 'Breeding area treatment'],
    exclusions: [],
    pricingTiers: [{ label: 'Indoor 1BHK', price: 499 }, { label: 'Indoor 2BHK', price: 699 }, { label: 'Outdoor 500sqft', price: 799 }],
    faqs: [],
  })

  await createSubCategory('pest-control', { name: 'Other Pest Control', slug: 'other-pest-control', image: 'https://images.unsplash.com/photo-1632163565874-b7a3a82b1527?w=400&q=80' })
  await createService('other-pest-control', {
    name: 'Bed Bug Treatment', slug: 'bed-bug-treatment',
    description: 'Bed bug treatment service.',
    image: 'https://images.unsplash.com/photo-1632163565874-b7a3a82b1527?w=400&q=80',
    basePrice: 2999, priceType: 'STARTING_AT',
    inclusions: ['Chemical treatment', 'Mattress treatment', 'Follow-up'],
    exclusions: [],
    pricingTiers: [{ label: '1 BHK', price: 2999 }, { label: '2 BHK', price: 3999 }, { label: '3 BHK', price: 4999 }],
    faqs: [],
  })
  await createService('other-pest-control', {
    name: 'Rodent Control', slug: 'rodent-control',
    description: 'Rodent control service.',
    image: 'https://images.unsplash.com/photo-1632163565874-b7a3a82b1527?w=400&q=80',
    basePrice: 1499, priceType: 'FIXED',
    inclusions: ['Bait placement', 'Trap setup', 'Entry point sealing'],
    exclusions: [],
    pricingTiers: [{ label: 'Standard', price: 1499 }],
    faqs: [],
  })
  await createService('other-pest-control', {
    name: 'General Pest Control', slug: 'general-pest-control',
    description: 'General pest control service.',
    image: 'https://images.unsplash.com/photo-1632163565874-b7a3a82b1527?w=400&q=80',
    basePrice: 699, priceType: 'STARTING_AT',
    inclusions: ['Ant control', 'Spider treatment', 'Lizard repellent'],
    exclusions: [],
    pricingTiers: [{ label: 'Ant control', price: 699 }, { label: 'Spider treatment', price: 699 }, { label: 'Honeybee removal', price: 999 }],
    faqs: [],
  })

  await createSubCategory('pest-control', { name: 'Commercial Pest Control', slug: 'commercial-pest-control', image: 'https://images.unsplash.com/photo-1632163565874-b7a3a82b1527?w=400&q=80' })
  await createService('commercial-pest-control', {
    name: 'Commercial Pest Control Service', slug: 'commercial-pest-control-service',
    description: 'Commercial pest control for offices and shops.',
    image: 'https://images.unsplash.com/photo-1632163565874-b7a3a82b1527?w=400&q=80',
    basePrice: 0, priceType: 'CUSTOM_QUOTE',
    inclusions: ['Custom treatment plan', 'Regular maintenance'],
    exclusions: [],
    pricingTiers: [],
    faqs: [],
  })

  console.log('✅ Category 6 Complete')

  // ═══════════════════════════════════════════
  // CATEGORY 7: BEAUTY & WELLNESS
  // ═══════════════════════════════════════════

  console.log('\n📦 Category 7: Beauty & Wellness')

  await createSubCategory('beauty-wellness', { name: 'Women Hair Services', slug: 'women-hair-services', image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a375?w=400&q=80' })
  await createService('women-hair-services', {
    name: 'Hair Services at Home', slug: 'hair-services-home',
    description: 'Professional hair services at home.',
    image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a375?w=400&q=80',
    basePrice: 199, priceType: 'STARTING_AT', duration: '30 mins - 3 hours', avgRating: 4.8,
    inclusions: ['Professional stylist', 'Quality products', 'Hygiene maintained'],
    exclusions: [],
    pricingTiers: [{ label: 'Basic trim', price: 199 }, { label: 'Hair wash + blowdry', price: 299 }, { label: 'Henna application', price: 299 }, { label: 'Hair spa (basic)', price: 499 }, { label: 'Hair spa (premium)', price: 899 }],
    faqs: [],
  })

  await createSubCategory('beauty-wellness', { name: 'Skin & Face', slug: 'skin-face-services', image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400&q=80' })
  await createService('skin-face-services', {
    name: 'Facial & Skin Services', slug: 'facial-skin-services',
    description: 'Professional facial and skin care services.',
    image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400&q=80',
    basePrice: 49, priceType: 'STARTING_AT', avgRating: 4.9,
    inclusions: ['Quality products', 'Hygienic service', 'Expert beautician'],
    exclusions: [],
    pricingTiers: [{ label: 'Threading (eyebrow)', price: 49 }, { label: 'Threading + shaping', price: 99 }, { label: 'Basic cleanup', price: 299 }, { label: 'Gold facial', price: 799 }, { label: 'Diamond facial', price: 1199 }],
    faqs: [],
  })

  await createSubCategory('beauty-wellness', { name: 'Body Services', slug: 'body-services', image: 'https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=400&q=80' })
  await createService('body-services', {
    name: 'Body Care at Home', slug: 'body-care-home',
    description: 'Professional body care services at home.',
    image: 'https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=400&q=80',
    basePrice: 99, priceType: 'STARTING_AT', avgRating: 4.8,
    inclusions: ['Quality products', 'Hygienic service'],
    exclusions: [],
    pricingTiers: [{ label: 'Manicure (basic)', price: 299 }, { label: 'Pedicure (basic)', price: 399 }, { label: 'Full wax (cold)', price: 599 }, { label: 'Full wax (hot)', price: 799 }, { label: 'Body polishing', price: 1499 }],
    faqs: [],
  })

  await createSubCategory('beauty-wellness', { name: 'Bridal Services', slug: 'bridal-services', image: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=400&q=80' })
  await createService('bridal-services', {
    name: 'Pre-Bridal Package', slug: 'pre-bridal-package',
    description: 'Complete pre-bridal grooming package.',
    image: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=400&q=80',
    basePrice: 5999, priceType: 'STARTING_AT', avgRating: 4.9,
    inclusions: ['Multiple sessions', 'Full body care', 'Expert beauticians'],
    exclusions: [],
    pricingTiers: [{ label: 'Basic package', price: 5999 }, { label: 'Standard package', price: 8999 }, { label: 'Premium package', price: 12999 }],
    faqs: [],
  })
  await createService('bridal-services', {
    name: 'Bridal Makeup', slug: 'bridal-makeup',
    description: 'Professional bridal makeup service.',
    image: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=400&q=80',
    basePrice: 2999, priceType: 'STARTING_AT',
    inclusions: ['HD makeup', 'Hair styling', 'Draping'],
    exclusions: [],
    pricingTiers: [{ label: 'Basic makeup', price: 2999 }, { label: 'HD makeup', price: 4999 }, { label: 'Airbrush makeup', price: 7999 }],
    faqs: [],
  })

  await createSubCategory('beauty-wellness', { name: "Men's Grooming", slug: 'mens-grooming', image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&q=80' })
  await createService('mens-grooming', {
    name: "Men's Grooming at Home", slug: 'mens-grooming-home',
    description: "Professional men's grooming services at home.",
    image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&q=80',
    basePrice: 99, priceType: 'STARTING_AT', avgRating: 4.7,
    inclusions: ['Expert barber', 'Quality products', 'Hygiene maintained'],
    exclusions: [],
    pricingTiers: [{ label: 'Beard trim', price: 99 }, { label: 'Traditional shave', price: 149 }, { label: 'Basic haircut', price: 149 }, { label: 'Head massage', price: 199 }, { label: 'Haircut + beard', price: 299 }],
    faqs: [],
  })

  await createSubCategory('beauty-wellness', { name: 'Spa & Wellness', slug: 'spa-wellness', image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&q=80' })
  await createService('spa-wellness', {
    name: 'Massage & Spa at Home', slug: 'massage-spa-home',
    description: 'Professional massage and spa services at home.',
    image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&q=80',
    basePrice: 399, priceType: 'STARTING_AT', avgRating: 4.9, professionals: 1,
    inclusions: ['Trained therapist', 'Quality oils', 'Hygiene maintained'],
    exclusions: [],
    pricingTiers: [{ label: 'Head massage (30 min)', price: 399 }, { label: 'Swedish (60 min)', price: 999 }, { label: 'Deep tissue (60 min)', price: 1299 }, { label: 'Full body (90 min)', price: 1799 }],
    faqs: [],
  })

  console.log('✅ Category 7 Complete')

  // ═══════════════════════════════════════════
  // CATEGORY 8: CARPENTRY
  // ═══════════════════════════════════════════

  console.log('\n📦 Category 8: Carpentry')

  await createSubCategory('carpentry', { name: 'Furniture Assembly & Repair', slug: 'furniture-assembly-repair', image: 'https://images.unsplash.com/photo-1566837945700-30057527ade0?w=400&q=80' })
  await createService('furniture-assembly-repair', {
    name: 'Furniture Assembly', slug: 'furniture-assembly',
    description: 'Professional furniture assembly service.',
    image: 'https://images.unsplash.com/photo-1566837945700-30057527ade0?w=400&q=80',
    basePrice: 199, priceType: 'STARTING_AT', duration: '30 mins - 4 hours', avgRating: 4.7,
    inclusions: ['Expert carpenter', 'All tools provided', 'Quality assembly'],
    exclusions: [],
    pricingTiers: [{ label: 'Small item (chair/side table)', price: 199 }, { label: 'IKEA furniture', price: 399 }, { label: 'Medium (dining/bed frame)', price: 499 }, { label: 'Large (wardrobe/modular)', price: 899 }],
    faqs: [],
  })
  await createService('furniture-assembly-repair', {
    name: 'Furniture Repair', slug: 'furniture-repair',
    description: 'Furniture repair service.',
    image: 'https://images.unsplash.com/photo-1566837945700-30057527ade0?w=400&q=80',
    basePrice: 99, priceType: 'STARTING_AT',
    inclusions: ['Expert carpenter', 'Quality repair'],
    exclusions: [],
    pricingTiers: [{ label: 'Hinge replacement', price: 99 }, { label: 'Drawer repair', price: 299 }, { label: 'General repair', price: 299 }, { label: 'Wardrobe door', price: 399 }],
    faqs: [],
  })

  await createSubCategory('carpentry', { name: 'Door & Window Work', slug: 'door-window-work', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80' })
  await createService('door-window-work', {
    name: 'Door & Window Services', slug: 'door-window-services',
    description: 'Door and window installation and repair.',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80',
    basePrice: 149, priceType: 'STARTING_AT', avgRating: 4.7,
    inclusions: ['Expert carpenter', 'Quality fittings'],
    exclusions: [],
    pricingTiers: [{ label: 'Mosquito mesh (per sqft)', price: 149 }, { label: 'Hinge replacement', price: 199 }, { label: 'Window repair', price: 299 }, { label: 'Lock installation', price: 299 }, { label: 'Door planing', price: 349 }],
    faqs: [],
  })

  await createSubCategory('carpentry', { name: 'Custom Carpentry', slug: 'custom-carpentry', image: 'https://images.unsplash.com/photo-1566837945700-30057527ade0?w=400&q=80' })
  await createService('custom-carpentry', {
    name: 'Custom Furniture', slug: 'custom-furniture',
    description: 'Custom furniture design and creation.',
    image: 'https://images.unsplash.com/photo-1566837945700-30057527ade0?w=400&q=80',
    basePrice: 0, priceType: 'CUSTOM_QUOTE', avgRating: 4.8, guarantee: '1-year craftsmanship guarantee',
    inclusions: ['Free site measurement', '3D design', 'Quality wood'],
    exclusions: [],
    pricingTiers: [],
    faqs: [],
  })

  console.log('✅ Category 8 Complete')

  // ═══════════════════════════════════════════
  // CATEGORY 9: HOME IMPROVEMENT
  // ═══════════════════════════════════════════

  console.log('\n📦 Category 9: Home Improvement')

  await createSubCategory('home-improvement', { name: 'False Ceiling', slug: 'false-ceiling', image: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=400&q=80' })
  await createService('false-ceiling', {
    name: 'False Ceiling Installation', slug: 'false-ceiling-installation',
    description: 'Professional false ceiling installation.',
    image: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=400&q=80',
    basePrice: 65, priceType: 'PER_SQFT', avgRating: 4.8, guarantee: '1-year structural guarantee',
    inclusions: ['Quality materials', 'Expert installation', 'Cleanup'],
    exclusions: [],
    pricingTiers: [{ label: 'Grid ceiling (office)', price: 65 }, { label: 'PVC panel', price: 70 }, { label: 'POP false ceiling', price: 85 }, { label: 'Gypsum board', price: 95 }],
    faqs: [],
  })

  await createSubCategory('home-improvement', { name: 'Flooring', slug: 'flooring-services', image: 'https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?w=400&q=80' })
  await createService('flooring-services', {
    name: 'Flooring Services', slug: 'flooring-installation',
    description: 'Professional flooring installation and repair.',
    image: 'https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?w=400&q=80',
    basePrice: 8, priceType: 'PER_SQFT', avgRating: 4.7,
    inclusions: ['Quality materials', 'Expert installation'],
    exclusions: [],
    pricingTiers: [{ label: 'Marble polishing', price: 8 }, { label: 'Tile grout filling', price: 15 }, { label: 'Vinyl flooring', price: 40 }, { label: 'Wooden flooring', price: 45 }],
    faqs: [],
  })

  await createSubCategory('home-improvement', { name: 'Wall Services', slug: 'wall-services', image: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=400&q=80' })
  await createService('wall-services', {
    name: 'Wall Treatment', slug: 'wall-treatment',
    description: 'Wall treatment and repair services.',
    image: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=400&q=80',
    basePrice: 12, priceType: 'STARTING_AT',
    inclusions: ['Quality materials', 'Expert work'],
    exclusions: [],
    pricingTiers: [{ label: 'Wall putty (per sqft)', price: 12 }, { label: 'Crack repair', price: 199 }, { label: 'Wallpaper (per roll)', price: 299 }],
    faqs: [],
  })

  await createSubCategory('home-improvement', { name: 'CCTV & Security', slug: 'cctv-security', image: 'https://images.unsplash.com/photo-1557597774-9d27f3447c6c?w=400&q=80' })
  await createService('cctv-security', {
    name: 'CCTV Installation', slug: 'cctv-installation',
    description: 'Professional CCTV installation service.',
    image: 'https://images.unsplash.com/photo-1557597774-9d27f3447c6c?w=400&q=80',
    basePrice: 499, priceType: 'STARTING_AT', avgRating: 4.8, guarantee: '6-month guarantee',
    inclusions: ['Expert installation', 'Configuration', 'Training'],
    exclusions: ['Camera cost extra'],
    pricingTiers: [{ label: 'Single camera', price: 499 }, { label: '4-camera package', price: 1499 }, { label: 'DVR + 4 cameras', price: 5999 }],
    faqs: [],
  })

  await createSubCategory('home-improvement', { name: 'Smart Home', slug: 'smart-home', image: 'https://images.unsplash.com/photo-1558002038-1055907df827?w=400&q=80' })
  await createService('smart-home', {
    name: 'Smart Home Setup', slug: 'smart-home-setup',
    description: 'Smart home automation setup.',
    image: 'https://images.unsplash.com/photo-1558002038-1055907df827?w=400&q=80',
    basePrice: 399, priceType: 'STARTING_AT', avgRating: 4.9,
    inclusions: ['Expert installation', 'Configuration', 'App setup'],
    exclusions: ['Device cost extra'],
    pricingTiers: [{ label: 'DTH installation', price: 399 }, { label: 'Smart switch (per switch)', price: 399 }, { label: 'TV mounting', price: 599 }, { label: 'Smart door lock', price: 799 }],
    faqs: [],
  })

  console.log('✅ Category 9 Complete')

  // ═══════════════════════════════════════════
  // CATEGORY 10: VEHICLE SERVICES
  // ═══════════════════════════════════════════

  console.log('\n📦 Category 10: Vehicle Services')

  await createSubCategory('vehicle-services', { name: 'Bike Services', slug: 'bike-services', image: 'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?w=400&q=80' })
  await createService('bike-services', {
    name: 'Bike Service at Home', slug: 'bike-service-home',
    description: 'Professional bike service at your doorstep.',
    image: 'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?w=400&q=80',
    basePrice: 99, priceType: 'STARTING_AT', avgRating: 4.7,
    inclusions: ['Expert mechanic', 'Quality products', 'Pickup & drop available'],
    exclusions: ['Spare parts cost extra'],
    pricingTiers: [{ label: 'Basic wash', price: 99 }, { label: 'Detailed wash', price: 199 }, { label: 'General service', price: 399 }, { label: 'Full service', price: 699 }],
    faqs: [],
  })

  await createSubCategory('vehicle-services', { name: 'Car Services', slug: 'car-services', image: 'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?w=400&q=80' })
  await createService('car-services', {
    name: 'Car Service at Home', slug: 'car-service-home',
    description: 'Professional car service at your doorstep.',
    image: 'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?w=400&q=80',
    basePrice: 249, priceType: 'STARTING_AT', avgRating: 4.7,
    inclusions: ['Expert mechanic', 'Quality products'],
    exclusions: ['Spare parts cost extra'],
    pricingTiers: [{ label: 'Exterior wash', price: 249 }, { label: 'Interior + exterior', price: 499 }, { label: 'AC gas refill', price: 999 }, { label: 'Deep cleaning', price: 1499 }],
    faqs: [],
  })

  console.log('✅ Category 10 Complete')

  // ═══════════════════════════════════════════
  // CATEGORY 11: PROPERTY SERVICES (No sub-categories)
  // ═══════════════════════════════════════════

  console.log('\n📦 Category 11: Property Services (Redirects to /property)')

  // ═══════════════════════════════════════════
  // CATEGORY 12: EDUCATION
  // ═══════════════════════════════════════════

  console.log('\n📦 Category 12: Education')

  await createSubCategory('education-tuition', { name: 'Home Tuition', slug: 'home-tuition', image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&q=80' })
  await createService('home-tuition', {
    name: 'Home Tuition', slug: 'home-tuition-service',
    description: 'Verified & qualified home tutors.',
    image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&q=80',
    basePrice: 1000, priceType: 'STARTING_AT', avgRating: 4.8,
    inclusions: ['Verified tutors', 'Personalized attention', 'Regular assessments'],
    exclusions: [],
    pricingTiers: [{ label: 'Class 1-5', price: 1000 }, { label: 'Class 6-8', price: 1500 }, { label: 'Class 9-10', price: 2000 }, { label: 'Class 11-12', price: 2500 }, { label: 'Competitive exam', price: 3000 }],
    faqs: [],
  })

  console.log('✅ Category 12 Complete')

  // ═══════════════════════════════════════════
  // CATEGORY 13: HEALTHCARE
  // ═══════════════════════════════════════════

  console.log('\n📦 Category 13: Healthcare')

  await createSubCategory('healthcare', { name: 'Nursing & Medical Care', slug: 'nursing-medical-care', image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&q=80' })
  await createService('nursing-medical-care', {
    name: 'Nursing Care at Home', slug: 'nursing-care-home',
    description: 'Professional nursing care at home.',
    image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&q=80',
    basePrice: 499, priceType: 'STARTING_AT', avgRating: 4.9,
    inclusions: ['Qualified nurses', 'Medical equipment', '24/7 support'],
    exclusions: [],
    pricingTiers: [{ label: 'Single visit (nurse)', price: 499 }, { label: 'Physiotherapy (per session)', price: 799 }, { label: 'Daily care (6 hrs)', price: 1499 }, { label: '24-hr attendant', price: 2500 }],
    faqs: [],
  })

  await createSubCategory('healthcare', { name: 'Diagnostic Services', slug: 'diagnostic-services', image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&q=80' })
  await createService('diagnostic-services', {
    name: 'Home Sample Collection', slug: 'home-sample-collection',
    description: 'Home sample collection for tests.',
    image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&q=80',
    basePrice: 99, priceType: 'STARTING_AT', avgRating: 4.8,
    inclusions: ['Certified technicians', 'Hygienic collection', 'Quick reports'],
    exclusions: ['Test charges extra'],
    pricingTiers: [{ label: 'Collection fee', price: 99 }, { label: 'Home visit', price: 199 }],
    faqs: [],
  })

  console.log('✅ Category 13 Complete')

  // ═══════════════════════════════════════════
  // CATEGORY 14: PET CARE
  // ═══════════════════════════════════════════

  console.log('\n📦 Category 14: Pet Care')

  await createSubCategory('pet-care', { name: 'Pet Grooming & Care', slug: 'pet-grooming-care', image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&q=80' })
  await createService('pet-grooming-care', {
    name: 'Pet Care at Home', slug: 'pet-care-home',
    description: 'Professional pet care and grooming at home.',
    image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&q=80',
    basePrice: 399, priceType: 'STARTING_AT', avgRating: 4.8,
    inclusions: ['Certified groomers', 'Quality products', 'Gentle handling'],
    exclusions: [],
    pricingTiers: [{ label: 'Cat grooming', price: 399 }, { label: 'Dog bath + groom (small)', price: 499 }, { label: 'Dog bath + groom (large)', price: 899 }, { label: 'Pet sitting (per day)', price: 499 }, { label: 'Dog walking (30min/day)', price: 699 }],
    faqs: [],
  })

  console.log('✅ Category 14 Complete')

  // ═══════════════════════════════════════════
  // CATEGORY 15: EVENTS
  // ═══════════════════════════════════════════

  console.log('\n📦 Category 15: Events')

  await createSubCategory('events-occasions', { name: 'Home Decoration', slug: 'home-decoration', image: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400&q=80' })
  await createService('home-decoration', {
    name: 'Event Decoration', slug: 'event-decoration-home',
    description: 'Professional event decoration at home.',
    image: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400&q=80',
    basePrice: 999, priceType: 'STARTING_AT', avgRating: 4.9,
    inclusions: ['Expert decorators', 'Quality materials', 'Setup & cleanup'],
    exclusions: [],
    pricingTiers: [{ label: 'Basic birthday', price: 999 }, { label: 'Premium birthday', price: 1999 }, { label: 'Baby shower', price: 2499 }, { label: 'Anniversary', price: 2999 }],
    faqs: [],
  })

  await createSubCategory('events-occasions', { name: 'Special Services', slug: 'event-special-services', image: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400&q=80' })
  await createService('event-special-services', {
    name: 'Event Special Services', slug: 'event-special',
    description: 'Special services for events and occasions.',
    image: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400&q=80',
    basePrice: 799, priceType: 'STARTING_AT',
    inclusions: ['Expert professionals', 'Quality service'],
    exclusions: [],
    pricingTiers: [{ label: 'Mehendi (full hands)', price: 799 }, { label: 'Puja + pandit', price: 1499 }, { label: 'Photography (3 hrs)', price: 2999 }, { label: 'Photography (6 hrs)', price: 5999 }],
    faqs: [],
  })

  console.log('✅ Category 15 Complete')

  // ═══════════════════════════════════════════
  // CATEGORY 16: PACKERS & MOVERS
  // ═══════════════════════════════════════════

  console.log('\n📦 Category 16: Packers & Movers')

  await createSubCategory('packers-movers', { name: 'Local Shifting', slug: 'local-shifting', image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400&q=80' })
  await createService('local-shifting', {
    name: 'Local House Shifting', slug: 'local-house-shifting',
    description: 'Professional local house shifting service.',
    image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400&q=80',
    basePrice: 2999, priceType: 'STARTING_AT', avgRating: 4.7,
    inclusions: ['Packing materials', 'Expert movers', 'Safe transportation', 'Unpacking'],
    exclusions: [],
    pricingTiers: [{ label: 'Bike transport (local)', price: 799 }, { label: 'Single item', price: 499 }, { label: '1 BHK shift', price: 2999 }, { label: '2 BHK shift', price: 4999 }, { label: '3 BHK shift', price: 7999 }],
    faqs: [],
  })

  await createSubCategory('packers-movers', { name: 'Intercity Shifting', slug: 'intercity-shifting', image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400&q=80' })
  await createService('intercity-shifting', {
    name: 'Intercity Shifting', slug: 'intercity-shifting-service',
    description: 'GPS tracked, insured intercity movers.',
    image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400&q=80',
    basePrice: 0, priceType: 'CUSTOM_QUOTE', avgRating: 4.7,
    inclusions: ['GPS tracking', 'Insurance', 'Safe packing', 'Door-to-door'],
    exclusions: [],
    pricingTiers: [],
    faqs: [],
  })

  console.log('✅ Category 16 Complete')

  console.log('\n🎉 Complete Phase 4 Seed Finished!')
  console.log('📊 Summary:')
  console.log('   - 16 Categories with images')
  console.log('   - 40+ Sub-categories')
  console.log('   - 80+ Services with pricing, inclusions, exclusions, FAQs')
}

main()
  .catch((e) => {
    console.error('❌', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })