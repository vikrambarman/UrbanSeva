import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  Linking,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import { useAuthStore } from '@/store/authStore'
import { COLORS } from '@/constants'
import { Ionicons } from '@expo/vector-icons'
import * as SecureStore from 'expo-secure-store'
import { toast } from '@/lib/toast'

interface BookingDetail {
  id: string
  bookingNumber: string
  status: string
  scheduledDate: string
  scheduledTime: string
  baseAmount: number
  addOnAmount: number
  totalAmount: number
  specialInstructions?: string
  razorpayPaymentId?: string
  paymentStatus: string
  createdAt: string
  service: {
    id: string
    name: string
    image: string | null
    description: string
    subCategory: {
      name: string
      category: { name: string }
    }
  }
  address: {
    label: string
    fullAddress: string
    area: string
    landmark?: string
    pincode: string
  }
  provider?: {
    id: string
    user: {
      name: string
      phone: string
      avatar?: string
    }
    avgRating: number
    totalJobs: number
  }
  statusHistory: Array<{
    id: string
    status: string
    note?: string
    createdAt: string
  }>
}

export default function BookingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const [booking, setBooking] = useState<BookingDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBooking()
  }, [id])

  const fetchBooking = async () => {
    try {
      const token = await SecureStore.getItemAsync('auth_token')
      const response = await fetch(`http://192.168.29.16:3000/api/bookings/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      if (data.success) {
        setBooking(data.data)
      } else {
        toast.error('Booking not found')
        router.back()
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to load booking')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: '#F59E0B',
      CONFIRMED: '#3B82F6',
      PROVIDER_ASSIGNED: '#8B5CF6',
      PROVIDER_TRAVELLING: '#6366F1',
      SERVICE_STARTED: '#F97316',
      SERVICE_COMPLETED: '#10B981',
      CANCELLED: '#EF4444',
    }
    return colors[status] || '#64748B'
  }

  const handleCancelBooking = async () => {
    if (!confirm('Are you sure you want to cancel this booking?')) return

    try {
      const token = await SecureStore.getItemAsync('auth_token')
      const response = await fetch(`http://192.168.29.16:3000/api/bookings/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: 'CANCELLED',
          cancelReason: 'Cancelled by customer',
        }),
      })

      const data = await response.json()
      if (data.success) {
        toast.success('Booking cancelled successfully')
        fetchBooking()
      } else {
        toast.error(data.error || 'Failed to cancel booking')
      }
    } catch (error) {
      toast.error('Failed to cancel booking')
    }
  }

  const handleCallProvider = () => {
    if (booking?.provider?.user.phone) {
      Linking.openURL(`tel:${booking.provider.user.phone}`)
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    )
  }

  if (!booking) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Booking not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Booking Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Service Info */}
        <View style={styles.serviceCard}>
          <View style={styles.serviceImageContainer}>
            {booking.service.image ? (
              <Image source={{ uri: booking.service.image }} style={styles.serviceImage} />
            ) : (
              <View style={styles.serviceImagePlaceholder}>
                <Ionicons name="construct-outline" size={40} color={COLORS.primary} />
              </View>
            )}
          </View>
          <View style={styles.serviceInfo}>
            <Text style={styles.serviceName}>{booking.service.name}</Text>
            <Text style={styles.serviceCategory}>
              {booking.service.subCategory.category.name} → {booking.service.subCategory.name}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) + '20' }]}>
              <Text style={[styles.statusText, { color: getStatusColor(booking.status) }]}>
                {booking.status.replace('_', ' ')}
              </Text>
            </View>
            <Text style={styles.bookingNumber}>#{booking.bookingNumber}</Text>
          </View>
        </View>

        {/* Schedule & Address */}
        <View style={styles.infoRow}>
          <View style={styles.infoCard}>
            <View style={styles.infoIcon}>
              <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Schedule</Text>
              <Text style={styles.infoValue}>
                {new Date(booking.scheduledDate).toLocaleDateString('en-IN', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                })}
              </Text>
              <Text style={styles.infoSubtext}>{booking.scheduledTime}</Text>
            </View>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoIcon}>
              <Ionicons name="location-outline" size={20} color={COLORS.primary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Address</Text>
              <Text style={styles.infoValue} numberOfLines={2}>
                {booking.address.area}
              </Text>
              <Text style={styles.infoSubtext}>{booking.address.pincode}</Text>
            </View>
          </View>
        </View>

        {/* Provider Info */}
        {booking.provider && (
          <View style={styles.providerCard}>
            <View style={styles.providerHeader}>
              <Ionicons name="person-circle-outline" size={40} color={COLORS.primary} />
              <View style={styles.providerInfo}>
                <Text style={styles.providerName}>{booking.provider.user.name}</Text>
                <View style={styles.providerRating}>
                  <Ionicons name="star" size={14} color="#FBBF24" />
                  <Text style={styles.ratingText}>{booking.provider.avgRating}</Text>
                  <Text style={styles.jobsText}>({booking.provider.totalJobs} jobs)</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity style={styles.callButton} onPress={handleCallProvider}>
              <Ionicons name="call-outline" size={16} color={COLORS.primary} />
              <Text style={styles.callButtonText}>Call Provider</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Status History */}
        {booking.statusHistory && booking.statusHistory.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Status History</Text>
            {booking.statusHistory.map((history, index) => (
              <View key={history.id} style={styles.historyItem}>
                <View style={styles.historyDot}>
                  <View style={[styles.dot, { backgroundColor: getStatusColor(history.status) }]} />
                  {index < booking.statusHistory.length - 1 && (
                    <View style={styles.historyLine} />
                  )}
                </View>
                <View style={styles.historyContent}>
                  <Text style={styles.historyStatus}>{history.status.replace('_', ' ')}</Text>
                  <Text style={styles.historyDate}>
                    {new Date(history.createdAt).toLocaleString('en-IN')}
                  </Text>
                  {history.note && <Text style={styles.historyNote}>{history.note}</Text>}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Payment Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Summary</Text>
          <View style={styles.paymentCard}>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Base Amount</Text>
              <Text style={styles.paymentValue}>₹{booking.baseAmount}</Text>
            </View>
            {booking.addOnAmount > 0 && (
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Add-ons</Text>
                <Text style={styles.paymentValue}>₹{booking.addOnAmount}</Text>
              </View>
            )}
            <View style={styles.paymentDivider} />
            <View style={styles.paymentRow}>
              <Text style={styles.paymentTotalLabel}>Total</Text>
              <Text style={styles.paymentTotalValue}>₹{booking.totalAmount}</Text>
            </View>
            <View style={[styles.paymentStatus, { backgroundColor: booking.paymentStatus === 'PAID' ? '#10B981' + '20' : '#F59E0B' + '20' }]}>
              <Text style={[styles.paymentStatusText, { color: booking.paymentStatus === 'PAID' ? '#10B981' : '#F59E0B' }]}>
                {booking.paymentStatus}
              </Text>
            </View>
            {booking.razorpayPaymentId && (
              <Text style={styles.paymentId}>Payment ID: {booking.razorpayPaymentId}</Text>
            )}
          </View>
        </View>

        {/* Special Instructions */}
        {booking.specialInstructions && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Special Instructions</Text>
            <View style={styles.instructionsCard}>
              <Text style={styles.instructionsText}>{booking.specialInstructions}</Text>
            </View>
          </View>
        )}

        {/* Cancel Button */}
        {(booking.status === 'PENDING' || booking.status === 'CONFIRMED') && (
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancelBooking}>
            <Ionicons name="close-circle-outline" size={20} color="#FFF" />
            <Text style={styles.cancelButtonText}>Cancel Booking</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  scrollView: { flex: 1 },
  serviceCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    margin: 16,
    borderRadius: 12,
    padding: 12,
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
  serviceImage: { width: '100%', height: '100%' },
  serviceImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.muted + '10',
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceInfo: { flex: 1 },
  serviceName: { fontSize: 16, fontWeight: 'bold', color: COLORS.text, marginBottom: 4 },
  serviceCategory: { fontSize: 12, color: COLORS.muted, marginBottom: 8 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  statusText: { fontSize: 11, fontWeight: '600' },
  bookingNumber: { fontSize: 12, color: COLORS.muted },
  infoRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 16,
  },
  infoCard: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 12, color: COLORS.muted, marginBottom: 2 },
  infoValue: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  infoSubtext: { fontSize: 12, color: COLORS.muted },
  providerCard: {
    backgroundColor: COLORS.card,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  providerHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  providerInfo: { flex: 1, marginLeft: 12 },
  providerName: { fontSize: 16, fontWeight: 'bold', color: COLORS.text, marginBottom: 4 },
  providerRating: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  jobsText: { fontSize: 12, color: COLORS.muted },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary + '20',
    paddingVertical: 10,
    borderRadius: 8,
  },
  callButtonText: { fontSize: 14, fontWeight: '600', color: COLORS.primary },
  section: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
  },
  historyItem: { flexDirection: 'row', marginBottom: 16 },
  historyDot: {
    width: 20,
    alignItems: 'center',
    marginRight: 12,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  historyLine: {
    width: 2,
    flex: 1,
    backgroundColor: COLORS.border,
    marginTop: 4,
  },
  historyContent: { flex: 1 },
  historyStatus: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 2 },
  historyDate: { fontSize: 12, color: COLORS.muted, marginBottom: 4 },
  historyNote: { fontSize: 12, color: COLORS.muted, fontStyle: 'italic' },
  paymentCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  paymentLabel: { fontSize: 14, color: COLORS.muted },
  paymentValue: { fontSize: 14, fontWeight: '500', color: COLORS.text },
  paymentDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 8,
  },
  paymentTotalLabel: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  paymentTotalValue: { fontSize: 20, fontWeight: 'bold', color: COLORS.primary },
  paymentStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 12,
  },
  paymentStatusText: { fontSize: 13, fontWeight: '600' },
  paymentId: { fontSize: 11, color: COLORS.muted, marginTop: 8, textAlign: 'center' },
  instructionsCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  instructionsText: { fontSize: 14, color: COLORS.text, lineHeight: 20 },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#EF4444',
    marginHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
  },
  cancelButtonText: { fontSize: 16, fontWeight: '600', color: '#FFF' },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: { fontSize: 16, color: COLORS.muted, marginBottom: 16 },
  backButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backButtonText: { color: '#FFF', fontWeight: '600' },
})