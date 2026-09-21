import { create } from 'zustand'

interface CategoryWithSubs {
  id: string
  name: string
  slug: string
  icon: string | null
  subCategories: {
    id: string
    name: string
    slug: string
    image: string | null
    description: string | null
  }[]
}

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
