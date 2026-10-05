'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Grid3x3, ArrowRight, Layers } from 'lucide-react'
import { CategoryWithSubs } from '@/types'
import { useUIStore } from '@/store/uiStore'
import CategoryModal from '@/components/services/CategoryModal'
import { ServiceImageWithFallback } from '@/components/services/ServiceImageWithFallback'

// ✅ ENHANCED — Premium category grid design
// Changes:
// 1. Hero header with gradient background + icon (category page jaisa)
// 2. Category cards: Subcategory count badge (top-right)
// 3. Enhanced hover effects: border glow, shadow, overlay opacity
// 4. View All tile: Gradient background + arrow animation
// 5. Better typography and spacing throughout

interface Props {
  categories: CategoryWithSubs[]
  limit?: number
  viewAllHref?: string
  showHeading?: boolean
  heading?: string
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transitions: { staggerChildren: 0.05 },
  },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

export default function CategoryGrid({
  categories,
  limit,
  viewAllHref = '/services',
  showHeading = true,
  heading = 'Hamari Services',
}: Props) {
  const { openCategoryModal, isCategoryModalOpen, selectedCategory, closeCategoryModal } =
    useUIStore()

  const visibleCategories = limit ? categories.slice(0, limit) : categories
  const hasMore = limit ? categories.length > limit : false

  return (
    <section className="py-10 md:py-14">
      <div className="max-w-[1400px] mx-auto px-4 md:px-6">
        {/* ✅ Hero Header Section — Category page jaisa premium design */}
        {showHeading && (
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/10 p-6 md:p-8 mb-8">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
            
            <div className="relative z-10 flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 shrink-0">
                <Layers className="h-7 w-7 text-primary" strokeWidth={1.75} />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                  {heading}
                </h2>
                <p className="text-muted-foreground text-sm md:text-base max-w-2xl">
                  {categories.length} service categories available — choose one to explore professional services
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ✅ Category Cards Grid */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-50px' }}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-5"
        >
          {visibleCategories.map((category) => (
            <motion.button
              key={category.id}
              variants={item}
              whileHover={{ y: -6 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => openCategoryModal(category)}
              className="relative aspect-[3/4] rounded-2xl overflow-hidden group text-left border-2 border-transparent hover:border-primary/30 hover:shadow-xl transition-all duration-300"
            >
              {/* Image */}
              <ServiceImageWithFallback
                src={category.image}
                alt={category.name}
                categorySlug={category.slug}
                className="object-cover transition-transform duration-500 group-hover:scale-110"
              />
              
              {/* Gradient overlay — enhanced */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent group-hover:from-black/90 transition-all duration-300" />

              {/* ✅ Subcategory count badge (top-right) */}
              <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-foreground text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm">
                {category.subCategories.length} {category.subCategories.length === 1 ? 'type' : 'types'}
              </div>

              {/* Category name */}
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <h3 className="font-semibold text-sm text-white line-clamp-2 leading-tight group-hover:text-primary-light transition-colors">
                  {category.name}
                </h3>
              </div>
            </motion.button>
          ))}

          {/* ✅ Enhanced View All tile */}
          {hasMore && (
            <motion.div variants={item}>
              <Link
                href={viewAllHref}
                className="relative aspect-[3/4] rounded-2xl overflow-hidden flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-primary to-primary-dark hover:from-primary-dark hover:to-primary transition-all duration-300 group border-2 border-transparent hover:border-primary-light/30 hover:shadow-xl"
              >
                {/* Background decoration */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                
                <div className="relative z-10 flex flex-col items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm group-hover:bg-white/30 transition-colors">
                    <Grid3x3 className="h-6 w-6 text-white" strokeWidth={1.75} />
                  </div>
                  <div className="text-center">
                    <span className="block text-sm font-bold text-white mb-1">
                      View All
                    </span>
                    <span className="block text-xs text-white/80">
                      {categories.length - (limit || 0)} more
                    </span>
                  </div>
                  <ArrowRight className="h-5 w-5 text-white group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            </motion.div>
          )}
        </motion.div>
      </div>

      <CategoryModal
        category={selectedCategory}
        isOpen={isCategoryModalOpen}
        onClose={closeCategoryModal}
      />
    </section>
  )
}