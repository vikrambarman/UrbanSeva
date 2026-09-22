import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
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
  priceType: string
  avgRating: number
  subCategory: {
    slug: string
    category: {
      slug: string
    }
  }
}

export default function SearchScreen() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Service[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  const handleSearch = async () => {
    if (!query.trim()) return

    setIsSearching(true)
    setHasSearched(true)
    try {
      const response = await servicesApi.search(query)
      if (response.data.success) {
        setResults(response.data.data)
      }
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setIsSearching(false)
    }
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

  return (
    <SafeAreaView style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={COLORS.muted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search services..."
            placeholderTextColor={COLORS.muted}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSearch}
            autoFocus
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={20} color={COLORS.muted} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.searchButtonText}>Search</Text>
        </TouchableOpacity>
      </View>

      {/* Results */}
      {isSearching ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.resultsContainer}
          ListEmptyComponent={
            hasSearched ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="search-outline" size={64} color={COLORS.muted} />
                <Text style={styles.emptyText}>No results found</Text>
                <Text style={styles.emptySubtext}>
                  Try different keywords
                </Text>
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="search-outline" size={64} color={COLORS.muted} />
                <Text style={styles.emptyText}>Search for services</Text>
                <Text style={styles.emptySubtext}>
                  Find cleaning, electrical, plumbing and more
                </Text>
              </View>
            )
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.resultCard}
              onPress={() => router.push(`/service-detail/${item.slug}`)}
            >
              {item.image ? (
                <Image source={{ uri: item.image }} style={styles.resultImage} />
              ) : (
                <View style={styles.resultImagePlaceholder}>
                  <Ionicons name="construct-outline" size={24} color={COLORS.primary} />
                </View>
              )}
              <View style={styles.resultContent}>
                <Text style={styles.resultName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.resultDescription} numberOfLines={2}>
                  {item.description}
                </Text>
                {item.avgRating > 0 && (
                  <View style={styles.resultRating}>
                    <Ionicons name="star" size={12} color="#FBBF24" />
                    <Text style={styles.resultRatingText}>{item.avgRating}</Text>
                  </View>
                )}
                <Text style={styles.resultPrice}>{getPriceDisplay(item)}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    fontSize: 15,
    color: COLORS.text,
  },
  searchButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    borderRadius: 12,
    justifyContent: 'center',
  },
  searchButtonText: {
    color: '#FFF',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultsContainer: {
    padding: 16,
    gap: 12,
  },
  resultCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  resultImage: {
    width: 100,
    height: 100,
  },
  resultImagePlaceholder: {
    width: 100,
    height: 100,
    backgroundColor: COLORS.muted + '10',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultContent: {
    flex: 1,
    padding: 12,
  },
  resultName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  resultDescription: {
    fontSize: 12,
    color: COLORS.muted,
    marginBottom: 6,
  },
  resultRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  resultRatingText: {
    fontSize: 12,
    color: COLORS.muted,
  },
  resultPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  emptyContainer: {
    padding: 48,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 13,
    color: COLORS.muted,
    marginTop: 4,
  },
})