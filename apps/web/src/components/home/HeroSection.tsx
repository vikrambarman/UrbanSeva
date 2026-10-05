'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Star, ArrowRight, type LucideIcon } from 'lucide-react'
import { useUIStore } from '@/store/uiStore'
import { getCategoryIcon } from '@/lib/category-icons'
import { CategoryWithSubs } from '@/types'
import { SITE_CONFIG } from '@/lib/config'

interface HeroStats {
  completedBookings: number
  totalCustomers: number
  avgRating: number
  verifiedProviders: number
}

interface HeroSectionProps {
  categories: CategoryWithSubs[]
  stats: HeroStats
}

function formatStat(num: number): string {
  if (num >= 1000) {
    return `${(num / 1000).toFixed(num % 1000 === 0 ? 0 : 1)}K+`
  }
  return `${num}+`
}

export default function HeroSection({ categories, stats }: HeroSectionProps) {
  // ✅ FIXED: Pehle yahan apna local useState tha jo ek ALAG CategoryModal
  // instance control karta tha (CategoryGrid ke apne instance se independent).
  // Ab same global store use ho raha hai jo CategoryGrid use karta hai —
  // click karne par wahi shared modal khulega (CategoryGrid mein render hota
  // hai). Isse 2 overlapping dialogs ka risk khatam hota hai.
  // NOTE: Ye assume karta hai ki HeroSection hamesha CategoryGrid ke saath
  // same page par render hoga (abhi homepage par yahi sach hai).
  const openCategoryModal = useUIStore((state) => state.openCategoryModal)

  const pillCategories = categories.slice(0, 7)

  const statItems = [
    stats.avgRating > 0 && {
      label: 'Service Rating',
      value: stats.avgRating.toFixed(1),
      icon: Star,
    },
    stats.totalCustomers > 0 && {
      label: 'Happy Customers',
      value: formatStat(stats.totalCustomers),
      icon: null,
    },
    stats.completedBookings > 0 && {
      label: 'Services Completed',
      value: formatStat(stats.completedBookings),
      icon: null,
    },
    stats.verifiedProviders > 0 && {
      label: 'Verified Professionals',
      value: formatStat(stats.verifiedProviders),
      icon: null,
    },
  ].filter(Boolean) as { label: string; value: string; icon: LucideIcon | null }[]

  return (
    <section className="relative overflow-hidden bg-background py-10 md:py-16">
      <div className="max-w-[1400px] mx-auto px-4 md:px-6">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* Left: Content */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="inline-flex items-center gap-1.5 bg-primary/10 text-primary text-sm font-medium px-3.5 py-1.5 rounded-full mb-5"
            >
              <Star className="h-3.5 w-3.5 fill-primary" />
              {SITE_CONFIG.city} ka #1 Home Service Platform
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="text-4xl md:text-5xl font-bold tracking-tight leading-[1.15] text-foreground mb-4"
              style={{ fontFamily: 'var(--font-devanagari), var(--font-sans)' }}
            >
              {SITE_CONFIG.city} ki Har Zaroorat,
              <br />
              <span className="text-gradient-orange">Ek Jagah</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="text-muted-foreground text-base md:text-lg mb-6 max-w-md"
            >
              Verified professionals, fixed pricing, quality guarantee.
              Ghar baithe book karo 100+ home services.
            </motion.p>

            {pillCategories.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                className="rounded-2xl border border-border p-4 mb-6"
              >
                <div className="grid grid-cols-4 gap-x-2 gap-y-4">
                  {pillCategories.map((category) => {
                    const Icon = getCategoryIcon(category.name || category.slug)
                    return (
                      <button
                        key={category.id}
                        onClick={() => openCategoryModal(category)}
                        className="flex flex-col items-center gap-1.5 group"
                      >
                        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted group-hover:bg-primary/10 transition-colors">
                          <Icon className="h-5 w-5 text-foreground group-hover:text-primary transition-colors" />
                        </span>
                        <span className="text-[10.5px] font-medium text-foreground text-center leading-tight line-clamp-2">
                          {category.name}
                        </span>
                      </button>
                    )
                  })}

                  <Link href="/services" className="flex flex-col items-center gap-1.5 group">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted group-hover:bg-primary/10 transition-colors">
                      <ArrowRight className="h-5 w-5 text-foreground group-hover:text-primary transition-colors" />
                    </span>
                    <span className="text-[10.5px] font-medium text-foreground text-center leading-tight">
                      View All
                    </span>
                  </Link>
                </div>
              </motion.div>
            )}

            {statItems.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.4 }}
                className="flex flex-wrap items-center gap-x-8 gap-y-3"
              >
                {statItems.map((stat) => {
                  const StatIcon = stat.icon
                  return (
                    <div key={stat.label} className="flex items-center gap-2">
                      {StatIcon && <StatIcon className="h-5 w-5 text-primary fill-primary" />}
                      <span className="font-bold text-foreground text-lg leading-none">
                        {stat.value}
                      </span>
                      <span className="text-xs text-muted-foreground">{stat.label}</span>
                    </div>
                  )
                })}
              </motion.div>
            )}
          </div>

          {/* Right: 4-image grid */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="hidden lg:grid grid-cols-2 gap-4"
          >
            <div className="relative rounded-3xl overflow-hidden aspect-[4/5] shadow-sm">
              <Image
                src="/images/hero/cleaning.jpg"
                alt="Home cleaning service professional at work"
                fill
                priority
                sizes="(max-width: 1024px) 0vw, 25vw"
                className="object-cover"
              />
            </div>
            <div className="flex flex-col gap-4">
              <div className="relative rounded-3xl overflow-hidden aspect-[4/3] shadow-sm">
                <Image
                  src="/images/hero/electrician.jpg"
                  alt="Electrician repairing appliance"
                  fill
                  sizes="(max-width: 1024px) 0vw, 25vw"
                  className="object-cover"
                />
              </div>
              <div className="relative rounded-3xl overflow-hidden aspect-[4/3] shadow-sm">
                <Image
                  src="/images/hero/ac-service.jpg"
                  alt="AC repair and service technician"
                  fill
                  sizes="(max-width: 1024px) 0vw, 25vw"
                  className="object-cover"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}