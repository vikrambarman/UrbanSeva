import type { MetadataRoute } from 'next'
import { db } from '@/lib/db'
import { SITE_CONFIG } from '@/lib/config'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = SITE_CONFIG.url

  // Static pages — jo hamesha exist karte hain
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/services`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/property`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/become-provider`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
  ]

  // Dynamic: active services with category/subcategory slugs
  const services = await db.service.findMany({
    where: { isActive: true },
    select: {
      slug: true,
      updatedAt: true,
      subCategory: {
        select: {
          slug: true,
          category: { select: { slug: true } },
        },
      },
    },
  })

  const serviceRoutes: MetadataRoute.Sitemap = services.map((service) => ({
    url: `${baseUrl}/services/${service.subCategory.category.slug}/${service.subCategory.slug}/${service.slug}`,
    lastModified: service.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  // Dynamic: active subcategory listing pages (category + subcategory, no service)
  // Duplicate subcategory URLs hatane ke liye Map use kiya (ek subcategory ke multiple services honge)
  const subCategoryMap = new Map<string, Date>()
  services.forEach((service) => {
    const key = `${service.subCategory.category.slug}/${service.subCategory.slug}`
    const existing = subCategoryMap.get(key)
    if (!existing || service.updatedAt > existing) {
      subCategoryMap.set(key, service.updatedAt)
    }
  })

  const subCategoryRoutes: MetadataRoute.Sitemap = Array.from(subCategoryMap.entries()).map(
    ([path, lastModified]) => ({
      url: `${baseUrl}/services/${path}`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.75,
    })
  )

  // Dynamic: active properties
  const properties = await db.property.findMany({
    where: { status: 'ACTIVE' },
    select: { id: true, updatedAt: true },
  })

  const propertyRoutes: MetadataRoute.Sitemap = properties.map((property) => ({
    url: `${baseUrl}/property/${property.id}`,
    lastModified: property.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.6,
  }))

  return [...staticRoutes, ...subCategoryRoutes, ...serviceRoutes, ...propertyRoutes]
}