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
import { servicesApi } from '@/lib/api'
import { COLORS } from '@/constants'
import { Ionicons } from '@expo/vector-icons'

interface Service {
  id: string
  name: string
  slug: string
  description: string
  image: string | null
  basePrice: number
  priceType: 'FIXED' | 'STARTING_AT' | 'PER_SQFT' | 'CUSTOM_QUOTE'
  duration: string
  avgRating: number
  totalReviews: number
  isTrending: boolean
  subCategory: {
    name: string
    slug: string
    category: {
      name: string
      slug: string
    }
  }
}

export default function SubCategoryScreen() {
  const { category, subcategory } = useLocalSearchParams<{
    category: string
    subcategory: string
  }>()
  
  const [services, setServices] = useState<Service[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [subCategoryName, setSubCategoryName] = useState('')

  const fetchServices = async () => {
    try {
      const response = await servicesApi.getByCategory(category!)
      if (response.data.success) {
        const filtered = response.data.data.filter(
          (s: Service) => s.subCategory.slug === subcategory
        )
        setServices(filtered)
        if (filtered.length > 0) {
          setSubCategoryName(filtered[0].subCategory.name)
        }
      }
    } catch (error) {
      console.error('Error fetching services:', error)
    } finally {
      setIsLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    if (category && subcategory) {
      fetchServices()
    }
  }, [category, subcategory])

  const onRefresh = () => {
    setRefreshing(true)
    fetchServices()
  }

  const getPriceDisplay = (service: Service) => {
    switch (service.priceType) {
      case 'FIXED':
        return `₹${service.basePrice}`
      case 'STARTING_AT':
        return `Starts ₹${service.basePrice}`
      case 'PER_SQFT':
        return `₹${service.basePrice}/sqft`
      case 'CUSTOM_QUOTE':
        return 'Free Quote'
      default:
        return `₹${service.basePrice}`
    }
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
          <Text style={styles.title}>{subCategoryName || 'Services'}</Text>
          <Text style={styles.subtitle}>
            {services.length} services available
          </Text>
        </View>

        {/* Services List */}
        <View style={styles.servicesContainer}>
          {services.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="construct-outline" size={64} color={COLORS.muted} />
              <Text style={styles.emptyText}>No services available</Text>
            </View>
          ) : (
            services.map((service) => (
              <TouchableOpacity
                key={service.id}
                style={styles.serviceCard}
                onPress={() => router.push(`/service-detail/${service.slug}`)}
                activeOpacity={0.7}
              >
                {/* Image */}
                <View style={styles.serviceImageContainer}>
                  {service.image ? (
                    <Image
                      source={{ uri: service.image }}
                      style={styles.serviceImage}
                    />
                  ) : (
                    <View style={styles.serviceImagePlaceholder}>
                      <Ionicons name="construct-outline" size={32} color={COLORS.primary} />
                    </View>
                  )}
                  {service.isTrending && (
                    <View style={styles.trendingBadge}>
                      <Text style={styles.trendingText}>🔥 Trending</Text>
                    </View>
                  )}
                </View>

                {/* Content */}
                <View style={styles.serviceContent}>
                  <Text style={styles.serviceName} numberOfLines={2}>
                    {service.name}
                  </Text>

                  <Text style={styles.serviceDescription} numberOfLines={2}>
                    {service.description}
                  </Text>

                  {/* Stats */}
                  <View style={styles.statsRow}>
                    {service.avgRating > 0 && (
                      <View style={styles.statItem}>
                        <Ionicons name="star" size={14} color="#FBBF24" />
                        <Text style={styles.statText}>
                          {service.avgRating} ({service.totalReviews})
                        </Text>
                      </View>
                    )}
                    {service.duration && (
                      <View style={styles.statItem}>
                        <Ionicons name="time-outline" size={14} color={COLORS.muted} />
                        <Text style={styles.statText}>{service.duration}</Text>
                      </View>
                    )}
                  </View>

                  {/* Price & CTA */}
                  <View style={styles.priceRow}>
                    <Text style={styles.price}>{getPriceDisplay(service)}</Text>
                    <View style={styles.bookButton}>
                      <Text style={styles.bookButtonText}>Book Now →</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))
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
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 16,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.muted,
    marginTop: 4,
  },
  servicesContainer: {
    padding: 16,
    gap: 12,
  },
  serviceCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  serviceImageContainer: {
    position: 'relative',
    height: 160,
  },
  serviceImage: {
    width: '100%',
    height: '100%',
  },
  serviceImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.muted + '10',
    justifyContent: 'center',
    alignItems: 'center',
  },
  trendingBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  trendingText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '600',
  },
  serviceContent: {
    padding: 12,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: 13,
    color: COLORS.muted,
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: COLORS.muted,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  bookButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  bookButtonText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 48,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.muted,
    marginTop: 12,
  },
})