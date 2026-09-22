import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  ScrollView,
  Image,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import { servicesApi } from '@/lib/api'
import { COLORS } from '@/constants'
import { Ionicons } from '@expo/vector-icons'

interface ServiceDetail {
  id: string
  name: string
  slug: string
  description: string
  image: string | null
  basePrice: number
  priceType: 'FIXED' | 'STARTING_AT' | 'PER_SQFT' | 'CUSTOM_QUOTE'
  duration: string
  professionals: number
  avgRating: number
  totalReviews: number
  guarantee: string | null
  isTrending: boolean
  subCategory: {
    name: string
    slug: string
    category: {
      name: string
      slug: string
    }
  }
  inclusions: { id: string; text: string }[]
  exclusions: { id: string; text: string }[]
  pricingTiers: { id: string; label: string; price: number }[]
  addOns: { id: string; name: string; price: number }[]
  faqs: { id: string; question: string; answer: string }[]
}

export default function ServiceDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const [service, setService] = useState<ServiceDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null)

  useEffect(() => {
    if (slug) {
      fetchService()
    }
  }, [slug])

  const fetchService = async () => {
    try {
      const response = await servicesApi.getBySlug(slug!)
      if (response.data.success) {
        setService(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching service:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getPriceDisplay = () => {
    if (!service) return ''
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

  if (!service) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Service not found</Text>
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
      <ScrollView style={styles.scrollView}>
        {/* Image */}
        {service.image ? (
          <Image source={{ uri: service.image }} style={styles.heroImage} />
        ) : (
          <View style={styles.heroImagePlaceholder}>
            <Ionicons name="construct-outline" size={64} color={COLORS.primary} />
          </View>
        )}

        {/* Content */}
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            {service.isTrending && (
              <View style={styles.trendingBadge}>
                <Text style={styles.trendingText}>🔥 Trending</Text>
              </View>
            )}
            {service.guarantee && (
              <View style={styles.guaranteeBadge}>
                <Ionicons name="shield-checkmark-outline" size={12} color="#10B981" />
                <Text style={styles.guaranteeText}>{service.guarantee}</Text>
              </View>
            )}

            <Text style={styles.serviceName}>{service.name}</Text>

            {/* Stats */}
            <View style={styles.statsRow}>
              {service.avgRating > 0 && (
                <View style={styles.statItem}>
                  <Ionicons name="star" size={16} color="#FBBF24" />
                  <Text style={styles.statText}>
                    {service.avgRating} ({service.totalReviews})
                  </Text>
                </View>
              )}
              {service.duration && (
                <View style={styles.statItem}>
                  <Ionicons name="time-outline" size={16} color={COLORS.muted} />
                  <Text style={styles.statText}>{service.duration}</Text>
                </View>
              )}
              <View style={styles.statItem}>
                <Ionicons name="person-outline" size={16} color={COLORS.muted} />
                <Text style={styles.statText}>
                  {service.professionals} Expert{service.professionals > 1 ? 's' : ''}
                </Text>
              </View>
            </View>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About this service</Text>
            <Text style={styles.description}>{service.description}</Text>
          </View>

          {/* What's Covered */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>What's Covered</Text>

            {service.inclusions.length > 0 && (
              <View style={styles.coveredSection}>
                <Text style={styles.coveredTitle}>
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" /> Included
                </Text>
                {service.inclusions.map((item) => (
                  <View key={item.id} style={styles.coveredItem}>
                    <Ionicons name="checkmark" size={14} color="#10B981" />
                    <Text style={styles.coveredText}>{item.text}</Text>
                  </View>
                ))}
              </View>
            )}

            {service.exclusions.length > 0 && (
              <View style={[styles.coveredSection, { marginTop: 16 }]}>
                <Text style={[styles.coveredTitle, { color: '#EF4444' }]}>
                  <Ionicons name="close-circle" size={16} color="#EF4444" /> Not Included
                </Text>
                {service.exclusions.map((item) => (
                  <View key={item.id} style={styles.coveredItem}>
                    <Ionicons name="close" size={14} color="#EF4444" />
                    <Text style={styles.coveredText}>{item.text}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Pricing */}
          {service.pricingTiers.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Pricing</Text>
              {service.pricingTiers.map((tier) => (
                <View key={tier.id} style={styles.pricingItem}>
                  <Text style={styles.pricingLabel}>{tier.label}</Text>
                  <Text style={styles.pricingPrice}>₹{tier.price}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Add-ons */}
          {service.addOns.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Add-ons</Text>
              {service.addOns.map((addOn) => (
                <View key={addOn.id} style={styles.addOnItem}>
                  <Text style={styles.addOnName}>{addOn.name}</Text>
                  <Text style={styles.addOnPrice}>+₹{addOn.price}</Text>
                </View>
              ))}
            </View>
          )}

          {/* FAQs */}
          {service.faqs.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>FAQs</Text>
              {service.faqs.map((faq) => (
                <TouchableOpacity
                  key={faq.id}
                  style={styles.faqItem}
                  onPress={() =>
                    setExpandedFaq(expandedFaq === faq.id ? null : faq.id)
                  }
                >
                  <View style={styles.faqHeader}>
                    <Text style={styles.faqQuestion} numberOfLines={2}>
                      {faq.question}
                    </Text>
                    <Ionicons
                      name={expandedFaq === faq.id ? 'chevron-up' : 'chevron-down'}
                      size={20}
                      color={COLORS.muted}
                    />
                  </View>
                  {expandedFaq === faq.id && (
                    <Text style={styles.faqAnswer}>{faq.answer}</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Bottom spacing */}
          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* Bottom Booking Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomBarContent}>
          <View>
            <Text style={styles.bottomBarLabel}>Price</Text>
            <Text style={styles.bottomBarPrice}>{getPriceDisplay()}</Text>
          </View>
          <TouchableOpacity
            style={styles.bookNowButton}
            onPress={() => router.push(`/booking/${service.slug}`)}
          >
            <Text style={styles.bookNowText}>Book Now →</Text>
          </TouchableOpacity>
        </View>
      </View>
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
  heroImage: {
    width: '100%',
    height: 240,
  },
  heroImagePlaceholder: {
    width: '100%',
    height: 240,
    backgroundColor: COLORS.muted + '10',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  trendingBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  trendingText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '600',
  },
  guaranteeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  guaranteeText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '500',
  },
  serviceName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 13,
    color: COLORS.muted,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: COLORS.muted,
    lineHeight: 22,
  },
  coveredSection: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  coveredTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
    marginBottom: 8,
  },
  coveredItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 6,
  },
  coveredText: {
    fontSize: 13,
    color: COLORS.text,
    flex: 1,
  },
  pricingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  pricingLabel: {
    fontSize: 14,
    color: COLORS.text,
  },
  pricingPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  addOnItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  addOnName: {
    fontSize: 14,
    color: COLORS.text,
  },
  addOnPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  faqItem: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
    flex: 1,
  },
  faqAnswer: {
    fontSize: 13,
    color: COLORS.muted,
    marginTop: 8,
    lineHeight: 20,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    padding: 12,
  },
  bottomBarContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bottomBarLabel: {
    fontSize: 12,
    color: COLORS.muted,
  },
  bottomBarPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  bookNowButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  bookNowText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
})