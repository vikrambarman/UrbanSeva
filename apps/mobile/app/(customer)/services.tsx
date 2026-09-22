import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { categoriesApi } from '@/lib/api'
import { COLORS } from '@/constants'

interface SubCategory {
  id: string
  name: string
  slug: string
  image: string | null
}

interface Category {
  id: string
  name: string
  slug: string
  icon: string | null
  image: string | null
  subCategories: SubCategory[]
}

export default function ServicesScreen() {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchCategories = async () => {
    try {
      const response = await categoriesApi.getAll()
      if (response.data.success) {
        setCategories(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    } finally {
      setIsLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  const onRefresh = () => {
    setRefreshing(true)
    fetchCategories()
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>All Services</Text>
          <Text style={styles.subtitle}>Browse all available services</Text>
        </View>

        {/* Categories List */}
        <View style={styles.categoriesContainer}>
          {categories.map((category) => (
            <View key={category.id} style={styles.categorySection}>
              <TouchableOpacity
                style={styles.categoryHeader}
                onPress={() => router.push(`/services/${category.slug}`)}
              >
                <View style={styles.categoryInfo}>
                  {category.image ? (
                    <Image
                      source={{ uri: category.image }}
                      style={styles.categoryImage}
                    />
                  ) : (
                    <View style={styles.categoryEmoji}>
                      <Text style={styles.emojiText}>{category.icon || '🏠'}</Text>
                    </View>
                  )}
                  <View style={styles.categoryText}>
                    <Text style={styles.categoryName}>{category.name}</Text>
                    <Text style={styles.categoryCount}>
                      {category.subCategories?.length || 0} sub-categories
                    </Text>
                  </View>
                </View>
                <Text style={styles.arrow}>→</Text>
              </TouchableOpacity>

              {/* Sub-categories preview */}
              {category.subCategories && category.subCategories.length > 0 && (
                <View style={styles.subCategoriesPreview}>
                  {category.subCategories.slice(0, 3).map((subCat) => (
                    <TouchableOpacity
                      key={subCat.id}
                      style={styles.subCategoryChip}
                      onPress={() =>
                        router.push(
                          `/services/${category.slug}/${subCat.slug}`
                        )
                      }
                    >
                      <Text style={styles.subCategoryText}>{subCat.name}</Text>
                    </TouchableOpacity>
                  ))}
                  {category.subCategories.length > 3 && (
                    <TouchableOpacity
                      style={styles.subCategoryChip}
                      onPress={() => router.push(`/services/${category.slug}`)}
                    >
                      <Text style={styles.subCategoryText}>
                        +{category.subCategories.length - 3} more
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  categoriesContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  categorySection: {
    marginBottom: 16,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryImage: {
    width: 48,
    height: 48,
    borderRadius: 12,
    marginRight: 12,
  },
  categoryEmoji: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  emojiText: {
    fontSize: 24,
  },
  categoryText: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  categoryCount: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  arrow: {
    fontSize: 20,
    color: COLORS.primary,
  },
  subCategoriesPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  subCategoryChip: {
    backgroundColor: COLORS.textMuted + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  subCategoryText: {
    fontSize: 12,
    color: COLORS.text,
  },
})