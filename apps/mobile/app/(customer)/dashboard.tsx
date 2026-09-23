import React, { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  StatusBar,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { categoriesApi, servicesApi } from '@/lib/api'
import { Category, Service } from '@/types'
import { COLORS, APP_NAME, CITY } from '@/constants'
import { Ionicons } from '@expo/vector-icons'
import { useCartStore } from '@/lib/cartStore'

const { width } = Dimensions.get('window')
const CARD_WIDTH = (width - 48) / 2

// ═══════════════════════════════
// SUB COMPONENTS
// ═══════════════════════════════

function Header() {

   const { getTotalItems } = useCartStore()
  const cartItemsCount = getTotalItems()

  return (
    <View style={styles.header}>
      <View>
        <Text style={styles.greeting}>Namaste! 👋</Text>
        <Text style={styles.location}>📍 Ambikapur, CG</Text>
      </View>
      <View style={styles.headerIcons}>
        <TouchableOpacity
          style={styles.cartIcon}
          onPress={() => router.push('/cart')}
        >
          <Ionicons name="cart-outline" size={24} color={COLORS.text} />
          {cartItemsCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartItemsCount}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity>
          <Ionicons name="notifications-outline" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>
    </View>
  )
}

function SearchBar() {
  return (
    <TouchableOpacity
      style={styles.searchBar}
      onPress={() => router.push('/(customer)/services')}
      activeOpacity={0.8}
    >
      <Text style={styles.searchIcon}>🔍</Text>
      <Text style={styles.searchText}>
        Kaunsi service chahiye?
      </Text>
    </TouchableOpacity>
  )
}

function CategoryCard({
  category,
  onPress,
}: {
  category: Category
  onPress: () => void
}) {
  return (
    <TouchableOpacity
      style={[styles.categoryCard, { width: CARD_WIDTH }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={styles.categoryIcon}>
        {category.icon || '🔧'}
      </Text>
      <Text style={styles.categoryName} numberOfLines={2}>
        {category.name}
      </Text>
      <Text style={styles.categoryCount}>
        {category.subCategories?.length || 0} services
      </Text>
    </TouchableOpacity>
  )
}

function ServiceCard({ service }: { service: Service }) {
  const handlePress = () => {
    router.push(
      `/services/${service.subCategory.category.slug}/${service.subCategory.slug}/${service.slug}` as never
    )
  }

  return (
    <TouchableOpacity
      style={styles.serviceCard}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      {/* Image Placeholder */}
      <View style={styles.serviceImageContainer}>
        <Text style={styles.serviceImageIcon}>
          {service.subCategory.category.icon || '🔧'}
        </Text>
      </View>

      {/* Content */}
      <View style={styles.serviceContent}>
        <Text style={styles.serviceName} numberOfLines={2}>
          {service.name}
        </Text>

        {/* Rating */}
        <View style={styles.ratingRow}>
          <Text style={styles.ratingStar}>⭐</Text>
          <Text style={styles.ratingText}>
            {service.avgRating.toFixed(1)}
          </Text>
          <Text style={styles.reviewCount}>
            ({service.totalReviews})
          </Text>
        </View>

        {/* Price */}
        <Text style={styles.servicePrice}>
          {service.priceType === 'FIXED'
            ? `₹${service.basePrice}`
            : `Starting ₹${service.basePrice}`}
        </Text>

        {/* Book Button */}
        <TouchableOpacity
          style={styles.bookBtn}
          onPress={handlePress}
        >
          <Text style={styles.bookBtnText}>Book Now</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  )
}

function OfferBanner() {
  return (
    <View style={styles.offerBanner}>
      <View style={styles.offerContent}>
        <Text style={styles.offerEmoji}>🎉</Text>
        <View style={styles.offerTextContainer}>
          <Text style={styles.offerTitle}>
            Pehli Booking pe 50% OFF!
          </Text>
          <Text style={styles.offerSubtitle}>
            Code: FIRST50 | Max ₹200
          </Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.offerBtn}
        onPress={() => router.push('/(customer)/services')}
      >
        <Text style={styles.offerBtnText}>Book Karo</Text>
      </TouchableOpacity>
    </View>
  )
}

// ═══════════════════════════════
// MAIN DASHBOARD
// ═══════════════════════════════

export default function Dashboard() {
  const [categories, setCategories] = useState<Category[]>([])
  const [trendingServices, setTrendingServices] = useState<Service[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setError(null)
      const [catsRes, servicesRes] = await Promise.all([
        categoriesApi.getAll(),
        servicesApi.getTrending(8),
      ])

      if (catsRes.data?.success) {
        setCategories(catsRes.data.data || [])
      }
      if (servicesRes.data?.success) {
        setTrendingServices(servicesRes.data.data || [])
      }
    } catch (err) {
      console.error('Dashboard fetch error:', err)
      setError('Data load nahi ho saka')
    } finally {
      setIsLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    fetchData()
  }, [fetchData])

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      >

        {/* Header */}
        <Header />

        {/* Search Bar */}
        <SearchBar />

        {/* Offer Banner */}
        <View style={styles.section}>
          <OfferBanner />
        </View>

        {/* Categories */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Hamari Services</Text>
            <TouchableOpacity
              onPress={() => router.push('/(customer)/services')}
            >
              <Text style={styles.seeAllText}>Sab dekho →</Text>
            </TouchableOpacity>
          </View>

          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity
                style={styles.retryBtn}
                onPress={fetchData}
              >
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={categories}
              keyExtractor={(item) => item.id}
              numColumns={2}
              scrollEnabled={false}
              columnWrapperStyle={styles.categoryRow}
              renderItem={({ item }) => (
                <CategoryCard
                  category={item}
                  onPress={() =>
                    router.push(`/services/${item.slug}` as never)
                  }
                />
              )}
              ListEmptyComponent={
                <Text style={styles.emptyText}>
                  Koi category nahi mili
                </Text>
              }
            />
          )}
        </View>

        {/* Trending Services */}
        {trendingServices.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                Trending Services
              </Text>
            </View>

            <FlatList
              data={trendingServices}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
              renderItem={({ item }) => (
                <ServiceCard service={item} />
              )}
            />
          </View>
        )}

        {/* Bottom Padding */}
        <View style={{ height: 80 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

// ═══════════════════════════════
// STYLES
// ═══════════════════════════════

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  greeting: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  location: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  notifBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  notifIcon: {
    fontSize: 18,
  },

  headerIcons: {
    flexDirection: 'row',
    gap: 16,
  },
  cartIcon: {
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },

  // Search
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 14,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 10,
  },
  searchIcon: {
    fontSize: 18,
  },
  searchText: {
    fontSize: 15,
    color: COLORS.textMuted,
    flex: 1,
  },

  // Section
  section: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  seeAllText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
  },

  // Offer Banner
  offerBanner: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  offerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  offerEmoji: {
    fontSize: 28,
  },
  offerTextContainer: {
    flex: 1,
  },
  offerTitle: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  offerSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginTop: 2,
  },
  offerBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    marginLeft: 8,
  },
  offerBtnText: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: 13,
  },

  // Category
  categoryRow: {
    gap: 12,
    marginBottom: 12,
  },
  categoryCard: {
    backgroundColor: COLORS.primaryBg,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  categoryIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  categoryCount: {
    fontSize: 11,
    color: COLORS.textMuted,
  },

  // Service Card
  horizontalList: {
    paddingRight: 16,
    gap: 12,
  },
  serviceCard: {
    width: 180,
    backgroundColor: COLORS.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  serviceImageContainer: {
    height: 100,
    backgroundColor: COLORS.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceImageIcon: {
    fontSize: 44,
  },
  serviceContent: {
    padding: 12,
    gap: 6,
  },
  serviceName: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    lineHeight: 18,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingStar: {
    fontSize: 11,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
  },
  reviewCount: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  servicePrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  bookBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  bookBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  // Error
  errorContainer: {
    alignItems: 'center',
    padding: 20,
    gap: 12,
  },
  errorText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  retryBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.textMuted,
    padding: 20,
  },
})
