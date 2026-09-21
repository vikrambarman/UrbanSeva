import { create } from 'zustand'
import { Category } from '@/types'

interface UIState {
  selectedCategorySlug: string | null
  selectedCategory: Category | null
  isSearchOpen: boolean
  searchQuery: string

  setSelectedCategory: (category: Category | null) => void
  setSearchOpen: (open: boolean) => void
  setSearchQuery: (query: string) => void
  clearSearch: () => void
}

export const useUIStore = create<UIState>((set) => ({
  selectedCategorySlug: null,
  selectedCategory: null,
  isSearchOpen: false,
  searchQuery: '',

  setSelectedCategory: (category) =>
    set({
      selectedCategory: category,
      selectedCategorySlug: category?.slug || null,
    }),

  setSearchOpen: (open) => set({ isSearchOpen: open }),

  setSearchQuery: (query) => set({ searchQuery: query }),

  clearSearch: () =>
    set({ isSearchOpen: false, searchQuery: '' }),
}))
