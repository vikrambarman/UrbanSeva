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
import { router, useLocalSearchParams } from 'expo-router'
import { categoriesApi } from '@/lib/api'
import { COLORS } from '@/constants'
import { Ionicons } from '@expo/vector-icons'

interface SubCategory {
  id: string
  name: string
  slug: string
  image: string | null
  description: string | null
}

interface Category {
  id: string
  name: string
  slug: string
  icon: string | null
  image: string | null
  description: string | null
  subCategories: SubCategory[]
}

export default function CategoryScreen() {
  const { category: categorySlug } = useLocalSearchParams<{ category: string }>()
  const [category, setCategory] = useState<Category | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchCategory = async () => {
    try {
      const response = await categoriesApi.getBySlug(categorySlug!)
      if (response.data.success) {
        setCategory(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching category:', error)
    } finally {
      setIsLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    if (categorySlug) {
      fetchCategory()
    }
  }, [categorySlug])

  const onRefresh = () => {
    setRefreshing(true)
    fetchCategory()
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

  if (!category) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Category not found</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
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
        {/* Header with Image */}
        <View style={styles.header}>
          {category.image ? (
            <Image
              source={{ uri: category.image }}
              style={styles.headerImage}
            />
          ) : (
            <View style={styles.headerEmoji}>
              <Text style={styles.emojiText}>{category.icon || '🏠'}</Text>
            </View>
          )}
          <View style={styles.headerContent}>
            <Text style={styles.categoryName}>{category.name}</Text>
            {category.description && (
              <Text style={styles.categoryDescription}>
                {category.description}
              </Text>
            )}
            <Text style={styles.subCategoryCount}>
              {category.subCategories?.length || 0} services available
            </Text>
          </View>
        </View>

        {/* Sub-categories Grid */}
        <View style={styles.subCategoriesContainer}>
          <Text style={styles.sectionTitle}>Services</Text>
          
          {category.subCategories && category.subCategories.length > 0 ? (
            <View style={styles.subCategoriesGrid}>
              {category.subCategories.map((subCat) => (
                <TouchableOpacity
                  key={subCat.id}
                  style={styles.subCategoryCard}
                  onPress={() =>
                    router.push(
                      `/services/${categorySlug}/${subCat.slug}`
                    )
                  }
                  activeOpacity={0.7}
                >
                  {subCat.image ? (
                    <Image
                      source={{ uri: subCat.image }}
                      style={styles.subCategoryImage}
                    />
                  ) : (
                    <View style={styles.subCategoryPlaceholder}>
                      <Ionicons name="construct-outline" size={32} color={COLORS.primary} />
                    </View>
                  )}
                  <View style={styles.subCategoryInfo}>
                    <Text style={styles.subCategoryName} numberOfLines={2}>
                      {subCat.name}
                    </Text>
                    <Text style={styles.viewServices}>View Services →</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No services available</Text>
            </View>
          )}
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.muted,
    marginBottom: 16,
  },
  backButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backButtonText: {
    color: '#FFF',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerImage: {
    width: '100%',
    height: 180,
  },
  headerEmoji: {
    width: '100%',
    height: 180,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiText: {
    fontSize: 64,
  },
  headerContent: {
    padding: 16,
  },
  categoryName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 14,
    color: COLORS.muted,
    marginBottom: 8,
  },
  subCategoryCount: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '500',
  },
  subCategoriesContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
  },
  subCategoriesGrid: {
    gap: 12,
  },
  subCategoryCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  subCategoryImage: {
    width: 100,
    height: 100,
  },
  subCategoryPlaceholder: {
    width: 100,
    height: 100,
    backgroundColor: COLORS.muted + '10',
    justifyContent: 'center',
    alignItems: 'center',
  },
  subCategoryInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  subCategoryName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  viewServices: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '500',
  },
  emptyContainer: {
    padding: 48,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.muted,
  },
})