import { create } from 'zustand'
import { CategoryWithSubs } from '@/types'

// ✅ FIXED: Pehle yahan ek local duplicate 'CategoryWithSubs' interface
// define tha jo '@/types' wale se out-of-sync ho sakta tha (jaise 'image'
// field missing thi). Isi wajah se CategoryGrid.tsx mein '{selectedCategory
// as any}' likhna pada tha — type-safety bypass. Ab single source-of-truth
// se import ho raha hai, 'as any' ki zaroorat khatam.
interface UIState {
  isCategoryModalOpen: boolean
  selectedCategory: CategoryWithSubs | null
  isSearchOpen: boolean
  searchQuery: string

  openCategoryModal: (category: CategoryWithSubs) => void
  closeCategoryModal: () => void
  toggleSearch: () => void
  setSearchQuery: (query: string) => void
}

export const useUIStore = create<UIState>((set) => ({
  isCategoryModalOpen: false,
  selectedCategory: null,
  isSearchOpen: false,
  searchQuery: '',

  openCategoryModal: (category) =>
    set({ isCategoryModalOpen: true, selectedCategory: category }),

  closeCategoryModal: () =>
    set({ isCategoryModalOpen: false, selectedCategory: null }),

  toggleSearch: () =>
    set((state) => ({ isSearchOpen: !state.isSearchOpen })),

  setSearchQuery: (query) => set({ searchQuery: query }),
}))