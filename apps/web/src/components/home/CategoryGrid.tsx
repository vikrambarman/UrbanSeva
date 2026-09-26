'use client'

import { motion } from 'framer-motion'
import { CategoryWithSubs } from '@/types'
import { useUIStore } from '@/store/uiStore'
import CategoryModal from '@/components/services/CategoryModal'
import { ChevronRight } from 'lucide-react'

interface Props {
  categories: CategoryWithSubs[]
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

export default function CategoryGrid({ categories }: Props) {
  const { openCategoryModal, isCategoryModalOpen,
    selectedCategory, closeCategoryModal } = useUIStore()

  return (
    <section className="py-12 container mx-auto px-4">
      {/* Heading */}
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground">
          Hamari Services
        </h2>
        <p className="text-muted-foreground mt-2">
          100+ services available in Ambikapur
        </p>
      </div>

      {/* Grid */}
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-50px' }}
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4"
      >
        {categories.map((category) => (
          <motion.div
            key={category.id}
            variants={item}
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => openCategoryModal(category)}
            className="bg-card border border-border rounded-2xl p-4 text-center cursor-pointer hover:shadow-md hover:border-primary/30 transition-all group"
          >
            {/* Icon */}
            <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">
              {category.icon || '🔧'}
            </div>

            {/* Name */}
            <h3 className="font-semibold text-sm text-foreground mb-1 line-clamp-2">
              {category.name}
            </h3>

            {/* Count */}
            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
              <span>{category.subCategories?.length || 0} services</span>
              <ChevronRight className="h-3 w-3" />
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Category Modal */}
      <CategoryModal
        category={selectedCategory as any}
        isOpen={isCategoryModalOpen}
        onClose={closeCategoryModal}
      />
    </section>
  )
}
