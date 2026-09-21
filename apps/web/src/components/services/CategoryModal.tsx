'use client'

import { useRouter } from 'next/navigation'
import { ChevronRight, X } from 'lucide-react'
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
      {/* Sub Categories Grid */}
      {category.subCategories && category.subCategories.length > 0 ? (
        <div className="grid grid-cols-2 gap-3">
          {category.subCategories.map((sub) => (
            <button
              key={sub.id}
              onClick={() => handleSubCategoryClick(sub.slug)}
              className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/30 hover:bg-primary/5 hover:border-primary/30 transition-all text-left group"
            >
              <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2">
                {sub.name}
              </span>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary shrink-0 ml-1" />
            </button>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <p>Koi subcategory nahi mili</p>
        </div>
      )}
    </div>
  )
}

export default function CategoryModal({ category, isOpen, onClose }: Props) {
  const isDesktop = useMediaQuery('(min-width: 768px)')

  if (!category) return null

  if (isDesktop) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <span className="text-2xl">{category.icon || '🔧'}</span>
              {category.name}
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
          <DrawerTitle className="flex items-center gap-2 text-xl">
            <span className="text-2xl">{category.icon || '🔧'}</span>
            {category.name}
          </DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-8">
          <ModalContent category={category} onClose={onClose} />
        </div>
      </DrawerContent>
    </Drawer>
  )
}
