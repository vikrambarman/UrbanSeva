import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { useAuthStore } from '@/store/authStore'
import { COLORS } from '@/constants'
import { Ionicons } from '@expo/vector-icons'
import * as SecureStore from 'expo-secure-store'

interface Booking {
  id: string
  bookingNumber: string
  status: string
  scheduledDate: string
  scheduledTime: string
  totalAmount: number
  service: {
    name: string
    image: string | null
    subCategory: {
      category: { name: string }
    }
  }
  address: {
    area: string
  }
}

export default function BookingsScreen() {
  const { token } = useAuthStore()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    fetchBookings()
  }, [statusFilter])

  const fetchBookings = async () => {
    try {
      const authToken = await SecureStore.getItemAsync('auth_token')
      const response = await fetch(
        `http://192.168.29.16:3000/api/bookings/my-bookings?status=${statusFilter}`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      )
      const data = await response.json()
      if (data.success) {
        setBookings(data.data.bookings)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const onRefresh = () => {
    setRefreshing(true)
    fetchBookings()
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: '#F59E0B',
      CONFIRMED: '#3B82F6',
      PROVIDER_ASSIGNED: '#8B5CF6',
      SERVICE_STARTED: '#F97316',
      SERVICE_COMPLETED: '#10B981',
      CANCELLED: '#EF4444',
    }
    return colors[status] || '#64748B'
  }

  const getStatusIcon = (status: string) => {
    const icons: Record<string, string> = {
      PENDING: 'time-outline',
      CONFIRMED: 'checkmark-circle-outline',
      PROVIDER_ASSIGNED: 'person-outline',
      SERVICE_STARTED: 'play-outline',
      SERVICE_COMPLETED: 'checkmark-done-outline',
      CANCELLED: 'close-circle-outline',
    }
    return icons[status] || 'help-outline'
  }

  const filterButtons = ['all', 'PENDING', 'CONFIRMED', 'SERVICE_COMPLETED', 'CANCELLED']

  if (loading) {
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
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Bookings</Text>
      </View>

      {/* Filter Buttons */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
      >
        {filterButtons.map((status) => (
          <TouchableOpacity
            key={status}
            style={[
              styles.filterButton,
              statusFilter === status && styles.filterButtonActive,
            ]}
            onPress={() => setStatusFilter(status)}
          >
            <Text
              style={[
                styles.filterButtonText,
                statusFilter === status && styles.filterButtonTextActive,
              ]}
            >
              {status === 'all' ? 'All' : status.replace('_', ' ')}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Bookings List */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {bookings.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={80} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>No bookings found</Text>
            <Text style={styles.emptyText}>
              {statusFilter === 'all'
                ? 'You haven\'t made any bookings yet'
                : `No ${statusFilter} bookings`}
            </Text>
            <TouchableOpacity
              style={styles.browseButton}
              onPress={() => router.push('/(customer)/services')}
            >
              <Text style={styles.browseButtonText}>Browse Services</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.bookingsContainer}>
            {bookings.map((booking) => (
              <TouchableOpacity
                key={booking.id}
                style={styles.bookingCard}
                onPress={() => router.push(`/booking-detail/${booking.id}`)}
              >
                {/* Service Image */}
                <View style={styles.serviceImageContainer}>
                  {booking.service.image ? (
                    <Image
                      source={{ uri: booking.service.image }}
                      style={styles.serviceImage}
                    />
                  ) : (
                    <View style={styles.serviceImagePlaceholder}>
                      <Ionicons name="construct-outline" size={32} color={COLORS.primary} />
                    </View>
                  )}
                </View>

                {/* Booking Details */}
                <View style={styles.bookingDetails}>
                  <View style={styles.bookingHeader}>
                    <Text style={styles.serviceName} numberOfLines={1}>
                      {booking.service.name}
                    </Text>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusColor(booking.status) + '20' },
                      ]}
                    >
                      <Ionicons
                        name={getStatusIcon(booking.status) as any}
                        size={12}
                        color={getStatusColor(booking.status)}
                      />
                      <Text
                        style={[
                          styles.statusText,
                          { color: getStatusColor(booking.status) },
                        ]}
                      >
                        {booking.status.replace('_', ' ')}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.bookingNumber}>#{booking.bookingNumber}</Text>

                  <View style={styles.bookingInfo}>
                    <View style={styles.infoItem}>
                      <Ionicons name="calendar-outline" size={14} color={COLORS.textMuted} />
                      <Text style={styles.infoText}>
                        {new Date(booking.scheduledDate).toLocaleDateString('en-IN')}
                      </Text>
                    </View>
                    <View style={styles.infoItem}>
                      <Ionicons name="time-outline" size={14} color={COLORS.textMuted} />
                      <Text style={styles.infoText}>{booking.scheduledTime}</Text>
                    </View>
                    <View style={styles.infoItem}>
                      <Ionicons name="location-outline" size={14} color={COLORS.textMuted} />
                      <Text style={styles.infoText}>{booking.address.area}</Text>
                    </View>
                  </View>

                  <View style={styles.bookingFooter}>
                    <Text style={styles.totalAmount}>₹{booking.totalAmount}</Text>
                    <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
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
  header: {
    padding: 16,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  filterContainer: {
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxHeight: 50, // Fixed height
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: COLORS.textMuted + '20',
    marginRight: 6,
    height: 32, // Fixed height
    justifyContent: 'center',
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
  },

  filterButtonText: {
    fontSize: 12, // Smaller font
    color: COLORS.text,
    fontWeight: '500',
  },

  filterButtonTextActive: {
    color: '#FFF',
  },
  
  scrollView: {
    flex: 1,
  },
  bookingsContainer: {
    padding: 16,
  },
  bookingCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  serviceImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 12,
  },
  serviceImage: {
    width: '100%',
    height: '100%',
  },
  serviceImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.textMuted + '10',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookingDetails: {
    flex: 1,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  serviceName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  bookingNumber: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 8,
  },
  bookingInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  bookingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: 24,
  },
  browseButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  browseButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
})