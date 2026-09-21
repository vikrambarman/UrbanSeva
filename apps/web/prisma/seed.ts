import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // ═══════════════════════════════
  // 1. ADMIN USER
  // ═══════════════════════════════
  const admin = await db.user.upsert({
    where: { phone: '9999999999' },
    update: {},
    create: {
      phone: '9999999999',
      name: 'Admin',
      role: 'ADMIN',
      isVerified: true,
      isActive: true,
    },
  })
  console.log('✅ Admin user created:', admin.phone)

  // ═══════════════════════════════
  // 2. SUBSCRIPTION PLANS
  // ═══════════════════════════════
  await db.subscriptionPlan.upsert({
    where: { id: 'plan-basic' },
    update: {},
    create: {
      id: 'plan-basic',
      name: 'Basic',
      price: 0,
      duration: 30,
      discount: 0,
      features: [
        'Standard booking',
        'Email support',
        'Basic services access',
      ],
      isActive: true,
    },
  })

  await db.subscriptionPlan.upsert({
    where: { id: 'plan-plus' },
    update: {},
    create: {
      id: 'plan-plus',
      name: 'Plus',
      price: 99,
      duration: 30,
      discount: 10,
      features: [
        '10% discount on all services',
        'Priority booking',
        'Phone support',
        'Free cancellation',
      ],
      isActive: true,
    },
  })

  await db.subscriptionPlan.upsert({
    where: { id: 'plan-premium' },
    update: {},
    create: {
      id: 'plan-premium',
      name: 'Premium',
      price: 199,
      duration: 30,
      discount: 15,
      features: [
        '15% discount on all services',
        'Priority booking',
        '24/7 support',
        'Free cancellation',
        'Dedicated account manager',
        'Early access to new services',
      ],
      isActive: true,
    },
  })
  console.log('✅ Subscription plans created')

  // ═══════════════════════════════
  // 3. APP SETTINGS
  // ═══════════════════════════════
  const settings = [
    {
      key: 'platform_commission',
      value: '20',
      description: 'Platform commission percentage',
    },
    {
      key: 'min_payout_amount',
      value: '500',
      description: 'Minimum payout amount for providers',
    },
    {
      key: 'otp_expiry_minutes',
      value: '5',
      description: 'OTP expiry time in minutes',
    },
    {
      key: 'cancellation_hours',
      value: '2',
      description: 'Hours before which cancellation is allowed',
    },
    {
      key: 'support_phone',
      value: '9876543210',
      description: 'Customer support phone number',
    },
    {
      key: 'support_email',
      value: 'support@serviceapp.com',
      description: 'Customer support email',
    },
    {
      key: 'app_name',
      value: 'ServiceApp',
      description: 'Application name',
    },
    {
      key: 'app_city',
      value: 'Ambikapur',
      description: 'Primary city',
    },
  ]

  for (const setting of settings) {
    await db.appSetting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    })
  }
  console.log('✅ App settings created')

  // ═══════════════════════════════
  // 4. SAMPLE COUPONS
  // ═══════════════════════════════
  await db.coupon.upsert({
    where: { code: 'FIRST50' },
    update: {},
    create: {
      code: 'FIRST50',
      description: 'Pehli booking pe 50% OFF (max ₹200)',
      discountType: 'PERCENTAGE',
      discountValue: 50,
      minOrderAmount: 200,
      maxDiscount: 200,
      usageLimit: 1000,
      perUserLimit: 1,
      validFrom: new Date(),
      validTill: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      isActive: true,
      applicableCategories: [],
    },
  })

  await db.coupon.upsert({
    where: { code: 'WELCOME100' },
    update: {},
    create: {
      code: 'WELCOME100',
      description: '₹100 flat discount on first booking',
      discountType: 'FIXED',
      discountValue: 100,
      minOrderAmount: 500,
      maxDiscount: 100,
      usageLimit: 500,
      perUserLimit: 1,
      validFrom: new Date(),
      validTill: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      isActive: true,
      applicableCategories: [],
    },
  })
  console.log('✅ Coupons created')

  // ═══════════════════════════════
  // 5. CATEGORIES (16)
  // ═══════════════════════════════
  const categories = [
    {
      name: 'Home Cleaning Services',
      slug: 'home-cleaning',
      icon: '🧹',
      description: 'Professional home cleaning services',
      sortOrder: 1,
    },
    {
      name: 'Electrical Services',
      slug: 'electrical',
      icon: '⚡',
      description: 'Expert electrical repairs and installation',
      sortOrder: 2,
    },
    {
      name: 'Plumbing Services',
      slug: 'plumbing',
      icon: '🔧',
      description: 'Professional plumbing solutions',
      sortOrder: 3,
    },
    {
      name: 'AC & Appliance Services',
      slug: 'ac-appliance',
      icon: '❄️',
      description: 'AC repair, service and appliance repair',
      sortOrder: 4,
    },
    {
      name: 'Painting Services',
      slug: 'painting',
      icon: '🎨',
      description: 'Interior and exterior painting',
      sortOrder: 5,
    },
    {
      name: 'Pest Control Services',
      slug: 'pest-control',
      icon: '🐛',
      description: 'Effective pest control solutions',
      sortOrder: 6,
    },
    {
      name: 'Beauty & Wellness',
      slug: 'beauty-wellness',
      icon: '💆',
      description: 'Salon and wellness services at home',
      sortOrder: 7,
    },
    {
      name: 'Carpentry Services',
      slug: 'carpentry',
      icon: '🪚',
      description: 'Professional carpentry and woodwork',
      sortOrder: 8,
    },
    {
      name: 'Home Improvement',
      slug: 'home-improvement',
      icon: '🏠',
      description: 'Home renovation and improvement',
      sortOrder: 9,
    },
    {
      name: 'Vehicle Services',
      slug: 'vehicle-services',
      icon: '🚗',
      description: 'Car and bike servicing at home',
      sortOrder: 10,
    },
    {
      name: 'Property Services',
      slug: 'property-services',
      icon: '🏢',
      description: 'Property listing and management',
      sortOrder: 11,
    },
    {
      name: 'Education & Tuition',
      slug: 'education-tuition',
      icon: '📚',
      description: 'Home tutoring and education',
      sortOrder: 12,
    },
    {
      name: 'Healthcare at Home',
      slug: 'healthcare',
      icon: '🏥',
      description: 'Medical and healthcare services',
      sortOrder: 13,
    },
    {
      name: 'Pet Care Services',
      slug: 'pet-care',
      icon: '🐾',
      description: 'Pet grooming and care services',
      sortOrder: 14,
    },
    {
      name: 'Events & Occasions',
      slug: 'events-occasions',
      icon: '🎉',
      description: 'Event planning and decoration',
      sortOrder: 15,
    },
    {
      name: 'Packers & Movers',
      slug: 'packers-movers',
      icon: '📦',
      description: 'Safe packing and moving services',
      sortOrder: 16,
    },
  ]

  for (const cat of categories) {
    await db.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: {
        ...cat,
        isActive: true,
      },
    })
  }
  console.log('✅ 16 Categories created')

  console.log('\n🎉 Database seeding complete!')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('Admin Phone: 9999999999')
  console.log('Categories: 16')
  console.log('Plans: 3')
  console.log('Coupons: 2')
  console.log('Settings: 8')
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
