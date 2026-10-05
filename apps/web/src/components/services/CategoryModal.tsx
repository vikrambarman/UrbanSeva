'use client'

import { useRouter } from 'next/navigation'
import { ChevronRight, Layers, SearchX } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { CategoryWithSubs } from '@/types'
import { getCategoryIcon } from '@/lib/category-icons'

// ✅ ENHANCED — Premium category modal design
// Changes:
// 1. 🔧 emoji → getCategoryIcon() (established rule)
// 2. Subcategory cards: Enhanced hover effects + arrow animation
// 3. Empty state: Icon + better messaging
// 4. Header: Icon with background circle

interface Props {
  category: CategoryWithSubs | null
  isOpen: boolean
  onClose: () => void
}

function ModalContent({
  category,
  onClose,
}: {
  category: CategoryWithSubs
  onClose: () => void
}) {
  const router = useRouter()

  const handleSubCategoryClick = (subCatSlug: string) => {
    if (category.slug === 'property-services') {
      router.push('/property')
    } else {
      router.push(`/services/${category.slug}/${subCatSlug}`)
    }
    onClose()
  }

  return (
    <div className="space-y-4">
      {category.subCategories && category.subCategories.length > 0 ? (
        <div className="grid grid-cols-2 gap-3">
          {category.subCategories.map((sub) => (
            <button
              key={sub.id}
              onClick={() => handleSubCategoryClick(sub.slug)}
              className="flex items-center justify-between p-4 rounded-xl border border-gray-200 bg-card hover:bg-primary/5 hover:border-primary/30 hover:shadow-md transition-all text-left group"
            >
              <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2">
                {sub.name}
              </span>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
            </button>
          ))}
        </div>
      ) : (
        // ✅ Enhanced empty state
        <div className="text-center py-12">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-muted mb-4">
            <SearchX className="h-7 w-7 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground text-base mb-1">
            Koi subcategory nahi mili
          </p>
          <p className="text-sm text-muted-foreground">
            Is category mein abhi koi services available nahi hain
          </p>
        </div>
      )}
    </div>
  )
}

export default function CategoryModal({ category, isOpen, onClose }: Props) {
  const isDesktop = useMediaQuery('(min-width: 768px)')

  if (!category) return null

  // ✅ FIX: 🔧 emoji → getCategoryIcon()
  const Icon = getCategoryIcon(category.slug)

  if (isDesktop) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl">
              {/* ✅ Icon with background circle */}
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 shrink-0">
                <Icon className="h-5 w-5 text-primary" strokeWidth={1.75} />
              </div>
              <span>{category.name}</span>
            </DialogTitle>
          </DialogHeader>
          <ModalContent category={category} onClose={onClose} />
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle className="flex items-center gap-3 text-xl">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 shrink-0">
              <Icon className="h-5 w-5 text-primary" strokeWidth={1.75} />
            </div>
            <span>{category.name}</span>
          </DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-8">
          <ModalContent category={category} onClose={onClose} />
        </div>
      </DrawerContent>
    </Drawer>
  )
}