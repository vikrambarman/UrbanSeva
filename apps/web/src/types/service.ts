import type {
  Service,
  SubCategory,
  Category,
  ServiceInclusion,
  ServiceExclusion,
  ServicePricing,
  ServiceAddOn,
  ServiceFAQ,
  ProviderService,
  Provider,
  User,
} from '@prisma/client'

export type ServiceWithDetails = Service & {
  subCategory: SubCategory & {
    category: Category
  }
  inclusions: ServiceInclusion[]
  exclusions: ServiceExclusion[]
  pricingTiers: ServicePricing[]
  addOns: ServiceAddOn[]
  faqs: ServiceFAQ[]
  providerServices: (ProviderService & {
    provider: Provider & {
      user: Pick<User, 'id' | 'name' | 'avatar'>
    }
  })[]
}

export type ServiceCardType = Service & {
  subCategory: SubCategory & {
    category: Pick<Category, 'id' | 'name' | 'slug'>
  }
}
